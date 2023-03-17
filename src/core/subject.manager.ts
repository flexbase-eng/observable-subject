import { Logger } from '@flexbase/logger';
import { Subject } from './subject.interface';
import { SubscriptionDispatcher } from './subscription.dispatcher';
import { noopSubscription, Subscription } from './subscription.interface';
import { SubscriptionContext } from './subscription.context';
import { multicastDispatcher } from './multicast.dispatcher';
import { SubscriptionCallback } from './subscription.callback';

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

/** Represents a type that manages subjects and subscriptions */
export class SubjectManager {
  private readonly _subjects = new Map<symbol, SubjectWrapper<unknown>>();

  constructor(private _logger?: Logger) {}

  set logger(logger: Logger) {
    this._logger = logger;
  }

  /**
   * Registers a subject
   * @param subject The subject to be registered
   * @param dispatcher The subscription dispatcher to use with this subject. Defaults to {@link multicastDispatcher}
   * @returns true if successfully registered; otherwise false
   */
  register(subject: Subject, dispatcher: SubscriptionDispatcher<unknown> = multicastDispatcher): boolean {
    if (this._subjects.has(subject.key)) {
      this._logger?.warn(`Duplicate subject ${subject.key.toString()} already registered`);
      return false;
    }

    this._subjects.set(subject.key, { subject, dispatcher, subscriptions: [] });
    return true;
  }

  /**
   * Checks if a subject is registered with this manager
   * @param subject The subject to check
   * @returns true if subject is registered; otherwise false
   */
  isRegistered(subject: Subject): boolean {
    return this._subjects.has(subject.key);
  }

  /**
   * Attaches a subscription to a subject
   * @param subject The subject to add a subscription
   * @param callback The callback when a subject event is raised
   * @returns A subscription
   */
  subscribe<T>(subject: Subject, callback: SubscriptionCallback<T>): Subscription {
    return this._subscribe(subject, callback as SubscriptionCallback<unknown>);
  }

  private _subscribe(subject: Subject, callback: SubscriptionCallback<unknown>): Subscription {
    const subjectWrapper = this._subjects.get(subject.key);

    if (!subjectWrapper) {
      this._logger?.warn(`Subject ${subject.key.toString()} has not been registered`);
      return noopSubscription;
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

  /**
   * Removes a subscription from subject notifications
   * @param subject The subject to remove the subscription from
   * @param subscription The subscription to remove
   */
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

  /**
   * Check to see if a subscription is attached to a subject
   * @param subject The subject to check for the specified subscription
   * @param subscription The subscription to check
   * @returns true if subject has the specified subscription; otherwise false
   */
  hasSubscription(subject: Subject, subscription: Subscription): boolean {
    const subjectWrapper = this._subjects.get(subject.key);

    if (!subjectWrapper) {
      this._logger?.warn(`Subject ${subject.key.toString()} has not been registered`);
      return false;
    }

    const index = subjectWrapper.subscriptions.findIndex(x => x.key === subscription.key);

    return index >= 0;
  }

  /**
   * Gets the number of subscriptions for a subject
   * @param subject The subject to inspect
   * @returns The number of subscriptions for the specified subject
   */
  subscriptionCount(subject: Subject): number {
    const subjectWrapper = this._subjects.get(subject.key);

    if (!subjectWrapper) {
      this._logger?.warn(`Subject ${subject.key.toString()} has not been registered`);
      return 0;
    }

    return subjectWrapper.subscriptions.length;
  }

  /**
   * Notify subscribers of a subject of an event
   * @param subject The subject used to raise a notification
   * @param context The context to send to subscriptions
   * @returns A promise
   */
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

/** Represents a global SubjectManager instance */
export const subjectManager = new SubjectManager();
