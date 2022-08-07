import { SubscriptionDispatcher } from './SubscriptionDispatcher';
import { SubscriptionContext } from './SubscriptionContext';
import { SubscriptionCallback } from './SubscriptionCallback';

export class MulticastDispatcher<T> implements SubscriptionDispatcher<T> {
  async dispatch(context: SubscriptionContext<T>, callbacks: SubscriptionCallback<T>[]): Promise<void> {
    await Promise.allSettled(callbacks.map(cb => cb(context)));
  }
}

export const multicastDispatcher = new MulticastDispatcher();
