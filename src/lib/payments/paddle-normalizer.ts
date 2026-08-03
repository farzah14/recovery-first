import type { BillingProductCode } from '@/domain/billing/product-catalog';
import type { NormalizedBillingEvent } from '@/domain/billing/normalized-event';
import type { EntitlementStatus } from '@/domain/subscriptions/entitlement';

export type PaddlePriceIds = Readonly<{
  lite_monthly: string;
  lite_annual: string;
  premium_monthly: string;
  premium_annual: string;
}>;

type PaddleNormalizerOptions = Readonly<{
  priceIds: PaddlePriceIds;
  providerPayloadHash: string;
}>;

type PaddleRecord = Record<string, unknown>;

export class BillingNormalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BillingNormalizationError';
  }
}

const normalizedEventTypes: Readonly<Record<string, string>> = {
  'subscription.created': 'subscription_created',
  'subscription.updated': 'subscription_updated',
  'subscription.trialing': 'subscription_trialing',
  'subscription.activated': 'subscription_activated',
  'subscription.past_due': 'subscription_past_due',
  'subscription.paused': 'subscription_paused',
  'subscription.resumed': 'subscription_resumed',
  'subscription.canceled': 'subscription_cancelled',
  'subscription.cancelled': 'subscription_cancelled',
  'adjustment.created': 'payment_adjustment_created',
  'adjustment.updated': 'payment_adjustment_updated',
};

function asRecord(value: unknown, label: string): PaddleRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BillingNormalizationError(`${label} must be an object`);
  }

  return value as PaddleRecord;
}

function readValue(record: PaddleRecord, snakeCase: string, camelCase: string): unknown {
  return record[snakeCase] ?? record[camelCase];
}

function requiredString(
  record: PaddleRecord,
  snakeCase: string,
  camelCase: string,
  label: string,
): string {
  const value = readValue(record, snakeCase, camelCase);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BillingNormalizationError(`${label} is required`);
  }

  return value;
}

function optionalString(
  record: PaddleRecord,
  snakeCase: string,
  camelCase: string,
): string | undefined {
  const value = readValue(record, snakeCase, camelCase);
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function parseDate(value: unknown, label: string): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(String(value ?? ''));
  if (Number.isNaN(date.getTime())) {
    throw new BillingNormalizationError(`${label} must be a valid timestamp`);
  }

  return date;
}

function readDate(
  record: PaddleRecord,
  snakeCase: string,
  camelCase: string,
  label: string,
): Date | undefined {
  const value = readValue(record, snakeCase, camelCase);
  return value === undefined || value === null ? undefined : parseDate(value, label);
}

function resolveProductCode(priceId: string, priceIds: PaddlePriceIds): BillingProductCode {
  const productCode = (Object.keys(priceIds) as Array<keyof PaddlePriceIds>).find(
    (candidate) => priceIds[candidate] === priceId,
  );

  if (!productCode) {
    throw new BillingNormalizationError(`Unknown Paddle price ID: ${priceId}`);
  }

  return productCode;
}

function resolvePriceId(data: PaddleRecord): string {
  const items = readValue(data, 'items', 'items');
  if (!Array.isArray(items) || items.length === 0) {
    throw new BillingNormalizationError('Subscription items are required');
  }

  const item = asRecord(items[0], 'Subscription item');
  const price = asRecord(readValue(item, 'price', 'price'), 'Subscription price');
  return requiredString(price, 'id', 'id', 'Subscription price ID');
}

function resolveStatus(
  eventType: string,
  data: PaddleRecord,
  occurredAt: Date,
): Readonly<{ status: EntitlementStatus; cancelAtPeriodEnd: boolean; validUntil?: Date }> {
  const scheduledChangeValue = readValue(data, 'scheduled_change', 'scheduledChange');
  const scheduledChange =
    scheduledChangeValue === null || scheduledChangeValue === undefined
      ? undefined
      : asRecord(scheduledChangeValue, 'Scheduled change');
  const scheduledAction = scheduledChange
    ? optionalString(scheduledChange, 'action', 'action')
    : undefined;
  const scheduledEffectiveAt = scheduledChange
    ? readDate(scheduledChange, 'effective_at', 'effectiveAt', 'Scheduled change effective_at')
    : undefined;
  const hasFutureCancellation =
    scheduledAction === 'cancel' &&
    scheduledEffectiveAt !== undefined &&
    scheduledEffectiveAt > occurredAt;

  if (eventType === 'adjustment.created' || eventType === 'adjustment.updated') {
    const action = optionalString(data, 'action', 'action');
    if (action === 'refund' || action === 'refunded') {
      return { status: 'refunded', cancelAtPeriodEnd: false };
    }
    throw new BillingNormalizationError(
      `Unsupported billing adjustment action: ${action ?? 'missing'}`,
    );
  }

  if (eventType === 'subscription.paused') {
    return { status: 'revoked', cancelAtPeriodEnd: false };
  }

  const rawStatus = optionalString(data, 'status', 'status');
  if (hasFutureCancellation) {
    return {
      status: rawStatus === 'trialing' ? 'trial_cancelled' : 'cancelled',
      cancelAtPeriodEnd: true,
      validUntil: scheduledEffectiveAt,
    };
  }

  if (eventType === 'subscription.trialing') {
    return { status: 'trial_active', cancelAtPeriodEnd: false };
  }
  if (eventType === 'subscription.activated') {
    return { status: 'active', cancelAtPeriodEnd: false };
  }
  if (eventType === 'subscription.past_due') {
    return { status: 'past_due', cancelAtPeriodEnd: false };
  }

  if (rawStatus === 'trialing') {
    return { status: 'trial_active', cancelAtPeriodEnd: false };
  }
  if (rawStatus === 'active') {
    return { status: 'active', cancelAtPeriodEnd: false };
  }
  if (rawStatus === 'past_due') {
    return { status: 'past_due', cancelAtPeriodEnd: false };
  }
  if (rawStatus === 'paused') {
    return { status: 'revoked', cancelAtPeriodEnd: false };
  }
  if (rawStatus === 'canceled' || rawStatus === 'cancelled') {
    return {
      status: eventType === 'subscription.canceled' ? 'expired' : 'expired',
      cancelAtPeriodEnd: false,
    };
  }

  throw new BillingNormalizationError(
    `Unsupported Paddle subscription status: ${rawStatus ?? 'missing'}`,
  );
}

function normalizeEventType(eventType: string): string {
  const normalized = normalizedEventTypes[eventType];
  if (!normalized) {
    throw new BillingNormalizationError(`Unsupported Paddle event type: ${eventType}`);
  }

  return normalized;
}

export function normalizePaddleSubscriptionEvent(
  input: unknown,
  options: PaddleNormalizerOptions,
): NormalizedBillingEvent {
  if (options.providerPayloadHash.trim() === '') {
    throw new BillingNormalizationError('Provider payload hash is required');
  }

  const event = asRecord(input, 'Paddle event');
  const eventType = requiredString(event, 'event_type', 'eventType', 'Paddle event type');
  const occurredAt = parseDate(
    readValue(event, 'occurred_at', 'occurredAt'),
    'Paddle occurrence timestamp',
  );
  const data = asRecord(readValue(event, 'data', 'data'), 'Paddle event data');
  const eventId = requiredString(event, 'event_id', 'eventId', 'Paddle event ID');
  const customerId = requiredString(data, 'customer_id', 'customerId', 'Paddle customer ID');
  const subscriptionId = requiredString(data, 'id', 'id', 'Paddle subscription ID');
  const customData = asRecord(readValue(data, 'custom_data', 'customData'), 'Paddle custom data');
  const userId = requiredString(customData, 'user_id', 'userId', 'Account user ID');
  const productCode = resolveProductCode(resolvePriceId(data), options.priceIds);
  const status = resolveStatus(eventType, data, occurredAt);
  const period = readValue(data, 'current_billing_period', 'currentBillingPeriod');
  const currentPeriod =
    period === null || period === undefined
      ? undefined
      : asRecord(period, 'Current billing period');
  const validFrom =
    (currentPeriod
      ? readDate(currentPeriod, 'starts_at', 'startsAt', 'Current billing period starts_at')
      : undefined) ??
    readDate(data, 'started_at', 'startedAt', 'Subscription started_at') ??
    occurredAt;
  const validUntil =
    status.validUntil ??
    (currentPeriod
      ? readDate(currentPeriod, 'ends_at', 'endsAt', 'Current billing period ends_at')
      : undefined) ??
    null;

  return {
    provider: 'paddle',
    eventId,
    eventType: normalizeEventType(eventType),
    occurredAt,
    customerId,
    subscriptionId,
    userId,
    productCode,
    status: status.status,
    validFrom,
    validUntil,
    cancelAtPeriodEnd: status.cancelAtPeriodEnd,
    providerPayloadHash: options.providerPayloadHash,
  };
}

export function normalizeFetchedPaddleSubscription(
  input: unknown,
  options: PaddleNormalizerOptions,
): NormalizedBillingEvent {
  const subscription = asRecord(input, 'Paddle subscription');
  const updatedAt = requiredString(
    subscription,
    'updated_at',
    'updatedAt',
    'Paddle subscription updated_at',
  );
  const subscriptionId = requiredString(subscription, 'id', 'id', 'Paddle subscription ID');

  return normalizePaddleSubscriptionEvent(
    {
      event_id: `reconciliation:${subscriptionId}:${updatedAt}`,
      event_type: 'subscription.updated',
      occurred_at: updatedAt,
      data: subscription,
    },
    options,
  );
}
