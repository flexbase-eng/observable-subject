import { test, expect, vi } from 'vitest';
import { noopLogger } from '@flexbase/logger';
import { Subject, subjectManager, multicastDispatcher } from '../../src/index';

test('SubjectManager register', () => {
  const sub: Subject = { key: Symbol() };

  const success = subjectManager.register(sub);

  expect(success).toBe(true);

  expect(subjectManager.isRegistered(sub)).toBe(true);
});

test('SubjectManager register duplicate', () => {
  const sub: Subject = { key: Symbol() };

  let success = subjectManager.register(sub);

  expect(success).toBe(true);
  expect(subjectManager.isRegistered(sub)).toBe(true);

  success = subjectManager.register(sub);

  expect(success).toBe(false);
  expect(subjectManager.isRegistered(sub)).toBe(true); // still registered
});

test('SubjectManager not registered', () => {
  const sub: Subject = { key: Symbol() };
  const loggerMethod = vi.spyOn(noopLogger, 'warn');

  expect(subjectManager.isRegistered(sub)).toBe(false);
  expect(subjectManager.subscriptionCount(sub)).toBe(0);
  expect(loggerMethod).toBeCalledTimes(1);
});

test('SubjectManager subscribe', () => {
  const sub: Subject = { key: Symbol() };

  const success = subjectManager.register(sub);

  expect(success).toBe(true);

  const subscription = subjectManager.subscribe(sub, _ => Promise.resolve());

  expect(subscription).not.toBeNull();

  expect(subjectManager.hasSubscription(sub, subscription)).toBe(true);
  expect(subjectManager.subscriptionCount(sub)).toBe(1);
});

test('SubjectManager subscribe not registered', () => {
  const sub: Subject = { key: Symbol() };

  const loggerMethod = vi.spyOn(noopLogger, 'warn');
  const subjectManagerMock = vi.spyOn(subjectManager, 'unsubscribe');

  const subscription = subjectManager.subscribe(sub, _ => Promise.resolve());

  expect(subscription).not.toBeNull();
  expect(loggerMethod).toBeCalledTimes(1);
  expect(subjectManager.subscriptionCount(sub)).toBe(0);

  const hasSubscription = subjectManager.hasSubscription(sub, subscription);
  expect(hasSubscription).toBe(false);

  subscription.unsubscribe();

  expect(subjectManagerMock).toBeCalledTimes(0);
});

test('SubjectManager unsubscribe', () => {
  const sub: Subject = { key: Symbol() };

  const subjectManagerMock = vi.spyOn(subjectManager, 'unsubscribe');

  const success = subjectManager.register(sub);

  expect(success).toBe(true);

  const subscription = subjectManager.subscribe(sub, _ => Promise.resolve());
  let hasSubscription = subjectManager.hasSubscription(sub, subscription);
  expect(subjectManager.subscriptionCount(sub)).toBe(1);

  expect(subscription).not.toBeNull();
  expect(hasSubscription).toBe(true);

  subscription.unsubscribe();

  expect(subjectManagerMock).toBeCalledTimes(1);

  hasSubscription = subjectManager.hasSubscription(sub, subscription);

  expect(hasSubscription).toBe(false);
  expect(subjectManager.subscriptionCount(sub)).toBe(0);
});

test('SubjectManager unsubscribe multiple calls does nothing', () => {
  const sub: Subject = { key: Symbol() };

  const subjectManagerMock = vi.spyOn(subjectManager, 'unsubscribe');
  const loggerMethod = vi.spyOn(noopLogger, 'warn');

  const success = subjectManager.register(sub);

  expect(success).toBe(true);

  const subscription = subjectManager.subscribe(sub, _ => Promise.resolve());
  let hasSubscription = subjectManager.hasSubscription(sub, subscription);
  expect(subjectManager.subscriptionCount(sub)).toBe(1);

  expect(subscription).not.toBeNull();
  expect(hasSubscription).toBe(true);

  subscription.unsubscribe();
  subscription.unsubscribe();
  subscription.unsubscribe();
  subscription.unsubscribe();

  expect(subjectManagerMock).toBeCalledTimes(1);
  expect(loggerMethod).toBeCalledTimes(0);

  hasSubscription = subjectManager.hasSubscription(sub, subscription);

  expect(hasSubscription).toBe(false);
  expect(subjectManager.subscriptionCount(sub)).toBe(0);
});

test('SubjectManager unsubscribe not registered', () => {
  const sub: Subject = { key: Symbol() };
  const loggerMethod = vi.spyOn(noopLogger, 'warn');

  subjectManager.unsubscribe(sub, { key: sub.key, unsubscribe: () => {} });

  expect(loggerMethod).toBeCalledTimes(1);
  expect(subjectManager.subscriptionCount(sub)).toBe(0);
});

test('SubjectManager unsubscribe no subscription', () => {
  const sub: Subject = { key: Symbol() };
  const loggerMethod = vi.spyOn(noopLogger, 'warn');

  const success = subjectManager.register(sub);

  expect(success).toBe(true);

  subjectManager.unsubscribe(sub, { key: sub.key, unsubscribe: () => {} });

  expect(loggerMethod).toBeCalledTimes(1);
  expect(subjectManager.subscriptionCount(sub)).toBe(0);
});

test('SubjectManager notify', async () => {
  const sub: Subject = { key: Symbol() };

  const fn1 = {
    m: async (id: number) => {
      await new Promise(_ => setTimeout(_, id));
    },
  };
  const fnMock1 = vi.spyOn(fn1, 'm');

  const fn2 = { m: (id: number) => id + 2 };
  const fnMock2 = vi.spyOn(fn1, 'm');

  const success = subjectManager.register(sub);

  expect(success).toBe(true);

  const subscription1 = subjectManager.subscribe<number>(sub, async context => {
    await fn1.m(context.value);
  });

  const subscription2 = subjectManager.subscribe<number>(sub, context => {
    fn2.m(context.value);
  });

  await subjectManager.notify(sub, { value: 1 });

  expect(fnMock1).toBeCalledTimes(1);
  expect(fnMock2).toBeCalledTimes(1);

  subscription1.unsubscribe();
  subscription2.unsubscribe();
});

test('SubjectManager notify multiple subscribers', async () => {
  const sub: Subject = { key: Symbol() };

  const fn = { m: (id: number) => id + 1 };
  const fnMock = vi.spyOn(fn, 'm');

  const success = subjectManager.register(sub);

  expect(success).toBe(true);

  const subscription1 = subjectManager.subscribe(sub, _ => {
    fn.m(1);
  });

  const subscription2 = subjectManager.subscribe<number>(sub, async context => {
    await new Promise(_ => setTimeout(_, context.value));
    fn.m(context.value);
  });

  await subjectManager.notify(sub, { value: 1000 });

  expect(fnMock).toBeCalledTimes(2);

  subscription1.unsubscribe();

  fnMock.mockClear();
  await subjectManager.notify(sub, { value: 1000 });

  expect(fnMock).toBeCalledTimes(1);

  subscription2.unsubscribe();

  fnMock.mockClear();
  await subjectManager.notify(sub, { value: 1000 });

  expect(fnMock).toBeCalledTimes(0);
});

test('SubjectManager notify not registered', async () => {
  const sub: Subject = { key: Symbol() };

  const helpers = {
    multicastDispatcher,
  };

  const multicastDispatcherMock = vi.spyOn(helpers, 'multicastDispatcher');
  const loggerMethod = vi.spyOn(noopLogger, 'warn');

  await subjectManager.notify(sub, { value: 1 });

  expect(multicastDispatcherMock).toBeCalledTimes(0);
  expect(loggerMethod).toBeCalledTimes(1);
});
