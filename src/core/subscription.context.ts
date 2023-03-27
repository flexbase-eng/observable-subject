/**
 * Represents the context sent to subscriptions on a notification
 */
export type SubscriptionContext<T> = {
  /** The value of the subscription context */
  value: Readonly<T>;
};
