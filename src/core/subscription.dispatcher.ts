import { SubscriptionCallback } from './subscription.callback.js';
import { SubscriptionContext } from './subscription.context.js';

/** Represents a subscription dispatcher */
export type SubscriptionDispatcher =
  /**
   * Handles dispatching the subscription callbacks
   * @param context The context sent to each subscription
   * @param callbacks The subscription callbacks that are to be notified
   */
  <T>(context: SubscriptionContext<T>, callbacks: SubscriptionCallback<T>[]) => Promise<void>;
