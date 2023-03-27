import { SubscriptionContext } from './subscription.context.js';

/**
 * Represents a subscription callback method
 * @param context - The context of the subscription notification
 */
export type SubscriptionCallback<T> = (context: SubscriptionContext<T>) => Promise<void> | void;
