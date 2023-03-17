/** Represents the context sent to subscriptions on a notification */
export interface SubscriptionContext<T> {
  /** The value of the context */
  value: Readonly<T>;
}
