import { SubscriptionContext } from './SubscriptionContext';

/** Represents a subscription callback method */
export type SubscriptionCallback<T> = (context: SubscriptionContext<T>) => Promise<void>;
