/** Represents a subscription */
export interface Subscription {
  /** The key used to identify this subscription */
  get key(): symbol;
  /** Unsubscribes from subject notifications */
  unsubscribe: () => void;
}

class NoopSubscription implements Subscription {
  private readonly _key = Symbol();
  get key(): symbol {
    return this._key;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unsubscribe(): void {}
}

/** Represents a global no-op subscription instance */
export const noopSubscription = new NoopSubscription();
