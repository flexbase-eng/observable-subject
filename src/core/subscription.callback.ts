import { SubscriptionContext } from './subscription.context.js';

/** Represents a subscription callback method */
export type SubscriptionCallback<T> = (context: SubscriptionContext<T>) => Promise<void>;
