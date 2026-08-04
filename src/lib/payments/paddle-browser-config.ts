import { z } from 'zod';

const publicBillingSchema = z.object({
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().min(1),
  NEXT_PUBLIC_PADDLE_ENVIRONMENT: z.enum(['sandbox', 'production']),
});

export type PublicBillingConfig = Readonly<{
  clientToken: string;
  environment: 'sandbox' | 'production';
}>;

export function getPublicBillingConfig(
  source: Record<string, string | undefined> = process.env,
): PublicBillingConfig {
  const parsed = publicBillingSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error('Paddle checkout configuration unavailable');
  }

  return {
    clientToken: parsed.data.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    environment: parsed.data.NEXT_PUBLIC_PADDLE_ENVIRONMENT,
  };
}
