export interface Subscription {
  get key(): symbol;
  unsubscribe: () => void;
}

/** @internal */
export class NoopSubscription implements Subscription {
  private readonly _key = Symbol();
  get key(): symbol {
    return this._key;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unsubscribe(): void {}
}
