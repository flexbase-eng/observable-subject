import { SubscriptionContext } from './SubscriptionContext';

export type SubscriptionCallback<T> = (context: SubscriptionContext<T>) => Promise<void>;
