import { SubscriptionCallback } from './Subject';
import { SubscriptionContext } from './SubscriptionContext';

export interface SubscriptionDispatcher<T> {
  dispatch(context: SubscriptionContext<T>, callbacks: SubscriptionCallback<T>[]): Promise<void>;
}
