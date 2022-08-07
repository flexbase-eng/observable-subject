/** Represents the context sent to subscriptions on a notification */
export interface SubscriptionContext<T> {
  value: Readonly<T>;
}
