import { SubscriptionDispatcher } from './subscription.dispatcher.js';
import { SubscriptionContext } from './subscription.context.js';
import { SubscriptionCallback } from './subscription.callback.js';

/** Represents a global multicast dispatcher instance */
export const multicastDispatcher: SubscriptionDispatcher = async <T>(
  context: SubscriptionContext<T>,
  callbacks: SubscriptionCallback<T>[]
): Promise<void> => {
  await Promise.allSettled(callbacks.map(cb => cb(context)));
};
