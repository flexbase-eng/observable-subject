import { Logger } from '@flexbase/logger';
import { Subject } from './Subject';
import { SubscriptionDispatcher } from './SubscriptionDispatcher';
import { NoopSubscription, Subscription } from './Subscription';
import { SubscriptionContext } from './SubscriptionContext';
import { multicastDispatcher } from './MulticastDispatcher';
import { SubscriptionCallback } from './SubscriptionCallback';

interface SubjectWrapper<T> {
  subject: Subject;
  subscriptions: SubscriptionWrapper<T>[];
  dispatcher: SubscriptionDispatcher<T>;
}

class SubscriptionWrapper<T> {
  private readonly _key: symbol;

  constructor(private readonly _subscription: Subscription, private readonly _callback: SubscriptionCallback<T>) {
    this._key = _subscription.key;
  }

  get key(): symbol {
    return this._key;
  }

  get subscription(): Subscription {
    return this._subscription;
  }
  get callback(): SubscriptionCallback<T> {
    return this._callback;
  }
}

export class SubjectManager {
  private readonly _subjects = new Map<symbol, SubjectWrapper<unknown>>();

  constructor(private _logger?: Logger) {}

  set logger(logger: Logger) {
    this._logger = logger;
  }

  register(subject: Subject, dispatcher: SubscriptionDispatcher<unknown> = multicastDispatcher): boolean {
    if (this._subjects.has(subject.key)) {
      this._logger?.warn(`Duplicate subject ${subject.key.toString()} already registered`);
      return false;
    }

    this._subjects.set(subject.key, { subject, dispatcher, subscriptions: [] });
    return true;
  }

  isRegistered(subject: Subject): boolean {
    return this._subjects.has(subject.key);
  }

  subscribe<T>(subject: Subject, callback: SubscriptionCallback<T>): Subscription {
    return this._subscribe(subject, callback as SubscriptionCallback<unknown>);
  }

  private _subscribe(subject: Subject, callback: SubscriptionCallback<unknown>): Subscription {
    const subjectWrapper = this._subjects.get(subject.key);

    if (!subjectWrapper) {
      this._logger?.warn(`Subject ${subject.key.toString()} has not been registered`);
      return new NoopSubscription();
    }

    const subscription: Subscription = {
      key: Symbol(),
      unsubscribe: () => {
        this.unsubscribe(subject, subscription);
      },
    };

    const subscriptionWrapper = new SubscriptionWrapper(subscription, callback);

    subjectWrapper.subscriptions.push(subscriptionWrapper);

    return subscriptionWrapper.subscription;
  }

  unsubscribe(subject: Subject, subscription: Subscription): void {
    const subjectWrapper = this._subjects.get(subject.key);

    if (!subjectWrapper) {
      this._logger?.warn(`Subject ${subject.key.toString()} has not been registered yet subscription ${subscription.toString()} called unsubscribe`);
      return;
    }

    const index = subjectWrapper.subscriptions.findIndex(x => x.key === subscription.key);
    if (index < 0) {
      this._logger?.warn(`Subject ${subject.key.toString()} does not have subscription ${subscription.toString()} registered`);
      return;
    }

    subjectWrapper.subscriptions.splice(index, 1);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    subscription.unsubscribe = () => {};
  }

  hasSubscription(subject: Subject, subscription: Subscription): boolean {
    const subjectWrapper = this._subjects.get(subject.key);

    if (!subjectWrapper) {
      this._logger?.warn(`Subject ${subject.key.toString()} has not been registered`);
      return false;
    }

    const index = subjectWrapper.subscriptions.findIndex(x => x.key === subscription.key);

    return index >= 0;
  }

  subscriptionCount(subject: Subject): number {
    const subjectWrapper = this._subjects.get(subject.key);

    if (!subjectWrapper) {
      this._logger?.warn(`Subject ${subject.key.toString()} has not been registered`);
      return 0;
    }

    return subjectWrapper.subscriptions.length;
  }

  async notify(subject: Subject, context: SubscriptionContext<unknown>): Promise<void> {
    const subjectWrapper = this._subjects.get(subject.key);

    if (!subjectWrapper) {
      this._logger?.warn(`Subject ${subject.key.toString()} has not been registered`);
      return;
    }

    const callbacks = subjectWrapper.subscriptions.map(x => x.callback);

    await subjectWrapper.dispatcher.dispatch(context, callbacks);
  }
}

export const subjectManager = new SubjectManager();
