import type { BillingProductCode } from '@/domain/billing/product-catalog';
import { billingProductForCode } from '@/domain/billing/product-catalog';
import type { NormalizedBillingEvent } from '@/domain/billing/normalized-event';
import type { EntitlementStatus } from '@/domain/subscriptions/entitlement';

import { BillingNormalizationError } from './paddle-normalizer';

type DokuRecord = Record<string, unknown>;

type DokuNormalizerOptions = Readonly<{
  requestId: string;
  providerPayloadHash: string;
  now?: Date;
}>;

function asRecord(value: unknown, label: string): DokuRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BillingNormalizationError(`${label} must be an object`);
  }
  return value as DokuRecord;
}

function read(record: DokuRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BillingNormalizationError(`${label} is required`);
  }
  return value;
}

function parseDate(value: unknown, label: string): Date {
  const date = new Date(String(value ?? ''));
  if (Number.isNaN(date.getTime())) {
    throw new BillingNormalizationError(`${label} must be a valid timestamp`);
  }
  return date;
}

function optionalDate(value: unknown, label: string): Date | null {
  return value === undefined || value === null ? null : parseDate(value, label);
}

function resolveProductCode(invoiceNumber: string, additionalInfo: DokuRecord): BillingProductCode {
  const configured = read(additionalInfo, 'product_code', 'productCode');
  if (typeof configured === 'string') {
    const product = billingProductForCode(configured);
    if (product && product.interval !== null && product.tier !== 'free') {
      return configured as BillingProductCode;
    }
  }

  const token = invoiceNumber.split('-')[1];
  const tokenMap: Readonly<Record<string, BillingProductCode>> = {
    LM: 'lite_monthly',
    LA: 'lite_annual',
    PM: 'premium_monthly',
    PA: 'premium_annual',
  };
  const resolved = token ? tokenMap[token] : undefined;
  if (!resolved) {
    throw new BillingNormalizationError('DOKU product code is required');
  }
  return resolved;
}

function resolveStatus(
  status: string,
  isRecurring: boolean,
): Readonly<{ status: EntitlementStatus; eventType: string }> {
  const normalized = status.trim().toUpperCase();
  if (normalized === 'SUCCESS' || normalized === 'PAID' || normalized === 'COMPLETED') {
    return { status: 'active', eventType: 'payment_succeeded' };
  }
  if (normalized === 'FAILED' || normalized === 'FAILURE') {
    return {
      status: isRecurring ? 'past_due' : 'expired',
      eventType: 'payment_failed',
    };
  }
  if (normalized === 'REFUNDED') {
    return { status: 'refunded', eventType: 'refund_succeeded' };
  }
  if (normalized === 'CANCELLED' || normalized === 'CANCELED') {
    return { status: 'cancelled', eventType: 'subscription_cancelled' };
  }
  if (normalized === 'CHARGEBACK' || normalized === 'REVOKED') {
    return { status: 'revoked', eventType: 'subscription_revoked' };
  }
  throw new BillingNormalizationError(`Unsupported DOKU transaction status: ${status}`);
}

export function normalizeDokuNotification(
  input: unknown,
  options: DokuNormalizerOptions,
): NormalizedBillingEvent {
  if (options.providerPayloadHash.trim() === '') {
    throw new BillingNormalizationError('Provider payload hash is required');
  }

  const event = asRecord(input, 'DOKU notification');
  const order = asRecord(read(event, 'order'), 'DOKU order');
  const customer = asRecord(read(event, 'customer'), 'DOKU customer');
  const transaction = asRecord(read(event, 'transaction'), 'DOKU transaction');
  const additionalInfo = asRecord(
    read(event, 'additional_info', 'additionalInfo'),
    'DOKU additional info',
  );
  const invoiceNumber = requiredString(
    read(order, 'invoice_number', 'invoiceNumber'),
    'DOKU invoice number',
  );
  const requestId = requiredString(options.requestId, 'DOKU notification request ID');
  const userId = requiredString(
    read(additionalInfo, 'user_id', 'userId') ?? read(customer, 'id'),
    'Account user ID',
  );
  const customerId = requiredString(read(customer, 'id') ?? userId, 'DOKU customer ID');
  const productCode = resolveProductCode(invoiceNumber, additionalInfo);
  const rawStatus = requiredString(
    read(transaction, 'status') ?? read(event, 'status') ?? read(event, 'payment_status'),
    'DOKU transaction status',
  );
  const isRecurring = read(additionalInfo, 'recurring', 'is_recurring') === true;
  const resolvedStatus = resolveStatus(rawStatus, isRecurring);
  const occurredAt = parseDate(
    read(transaction, 'date', 'transaction_date') ?? read(event, 'date', 'updated_at'),
    'DOKU transaction timestamp',
  );
  const subscription = asRecord(
    read(event, 'subscription', 'billing') ?? {},
    'DOKU subscription details',
  );
  const subscriptionId = requiredString(
    read(subscription, 'id', 'subscription_id', 'billing_id') ?? invoiceNumber,
    'DOKU subscription ID',
  );
  const validFrom =
    optionalDate(read(subscription, 'period_start', 'current_period_start'), 'DOKU period start') ??
    occurredAt;
  const validUntil = optionalDate(
    read(subscription, 'period_end', 'current_period_end'),
    'DOKU period end',
  );
  const cancelAtPeriodEnd =
    read(subscription, 'cancel_at_period_end', 'cancelAtPeriodEnd') === true;

  return {
    provider: 'doku',
    eventId: requestId,
    eventType: resolvedStatus.eventType,
    occurredAt,
    customerId,
    subscriptionId,
    userId,
    productCode,
    status: resolvedStatus.status,
    validFrom,
    validUntil,
    cancelAtPeriodEnd,
    providerPayloadHash: options.providerPayloadHash,
  };
}
