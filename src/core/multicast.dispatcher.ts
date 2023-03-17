import { SubscriptionDispatcher } from './subscription.dispatcher';
import { SubscriptionContext } from './subscription.context';
import { SubscriptionCallback } from './subscription.callback';

export class MulticastDispatcher<T> implements SubscriptionDispatcher<T> {
  async dispatch(context: SubscriptionContext<T>, callbacks: SubscriptionCallback<T>[]): Promise<void> {
    await Promise.allSettled(callbacks.map(cb => cb(context)));
  }
}

/** Represents a global multicast dispatcher instance */
export const multicastDispatcher = new MulticastDispatcher();
