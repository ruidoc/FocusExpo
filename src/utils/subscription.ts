export type SubscriptionLike = {
  status?: 'active' | 'canceled' | 'cancelled' | 'expired' | string | null;
  expires_at?: string | Date | null;
};

const ENTITLED_STATUSES = new Set(['active', 'canceled', 'cancelled']);

export const isSubscriptionEntitled = (
  subscription?: SubscriptionLike | null,
  now: Date = new Date(),
) => {
  if (!subscription?.status || !subscription.expires_at) {
    return false;
  }

  if (!ENTITLED_STATUSES.has(subscription.status)) {
    return false;
  }

  const expiresAt = new Date(subscription.expires_at);
  if (Number.isNaN(expiresAt.getTime())) {
    return false;
  }

  return expiresAt > now;
};
