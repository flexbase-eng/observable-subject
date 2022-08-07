import { noopLogger } from '@flexbase/logger';
import { Subject, subjectManager, multicastDispatcher } from '../../src/index';

test('SubjectManager register', () => {
  let sub: Subject = { key: Symbol() };

  const success = subjectManager.register(sub);

  expect(success).toBe(true);

  expect(subjectManager.isRegistered(sub)).toBe(true);
});

test('SubjectManager register duplicate', () => {
  let sub: Subject = { key: Symbol() };

  let success = subjectManager.register(sub);

  expect(success).toBe(true);
  expect(subjectManager.isRegistered(sub)).toBe(true);

  success = subjectManager.register(sub);

  expect(success).toBe(false);
  expect(subjectManager.isRegistered(sub)).toBe(true); // still registered
});

test('SubjectManager not registered', () => {
  let sub: Subject = { key: Symbol() };
  const loggerMethod = jest.spyOn(noopLogger, 'warn');

  expect(subjectManager.isRegistered(sub)).toBe(false);
  expect(subjectManager.subscriptionCount(sub)).toBe(0);
  expect(loggerMethod).toBeCalledTimes(1);
});

test('SubjectManager subscribe', () => {
  let sub: Subject = { key: Symbol() };

  const success = subjectManager.register(sub);

  expect(success).toBe(true);

  const subscription = subjectManager.subscribe(sub, _ => Promise.resolve());

  expect(subscription).not.toBeNull();

  expect(subjectManager.hasSubscription(sub, subscription)).toBe(true);
  expect(subjectManager.subscriptionCount(sub)).toBe(1);
});

test('SubjectManager subscribe not registered', () => {
  let sub: Subject = { key: Symbol() };

  const loggerMethod = jest.spyOn(noopLogger, 'warn');
  const subjectManagerMock = jest.spyOn(subjectManager, 'unsubscribe');

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
  let sub: Subject = { key: Symbol() };

  const subjectManagerMock = jest.spyOn(subjectManager, 'unsubscribe');

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
  let sub: Subject = { key: Symbol() };

  const subjectManagerMock = jest.spyOn(subjectManager, 'unsubscribe');
  const loggerMethod = jest.spyOn(noopLogger, 'warn');

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
  let sub: Subject = { key: Symbol() };
  const loggerMethod = jest.spyOn(noopLogger, 'warn');

  subjectManager.unsubscribe(sub, { key: sub.key, unsubscribe: () => {} });

  expect(loggerMethod).toBeCalledTimes(1);
  expect(subjectManager.subscriptionCount(sub)).toBe(0);
});

test('SubjectManager unsubscribe no subscription', () => {
  let sub: Subject = { key: Symbol() };
  const loggerMethod = jest.spyOn(noopLogger, 'warn');

  const success = subjectManager.register(sub);

  expect(success).toBe(true);

  subjectManager.unsubscribe(sub, { key: sub.key, unsubscribe: () => {} });

  expect(loggerMethod).toBeCalledTimes(1);
  expect(subjectManager.subscriptionCount(sub)).toBe(0);
});

test('SubjectManager notify', async () => {
  let sub: Subject = { key: Symbol() };

  const fn = { m: (id: number) => id + 1 };
  const fnMock = jest.spyOn(fn, 'm');

  const success = subjectManager.register(sub);

  expect(success).toBe(true);

  const subscription = subjectManager.subscribe(sub, _ => {
    fn.m(1);
    return Promise.resolve();
  });

  await subjectManager.notify(sub, { value: 1 });

  expect(fnMock).toBeCalledTimes(1);
});

test('SubjectManager notify multiple subscribers', async () => {
  let sub: Subject = { key: Symbol() };

  const fn = { m: (id: number) => id + 1 };
  const fnMock = jest.spyOn(fn, 'm');

  const success = subjectManager.register(sub);

  expect(success).toBe(true);

  const subscription1 = subjectManager.subscribe(sub, _ => {
    fn.m(1);
    return Promise.resolve();
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
  let sub: Subject = { key: Symbol() };

  const multicastDispatcherMock = jest.spyOn(multicastDispatcher, 'dispatch');
  const loggerMethod = jest.spyOn(noopLogger, 'warn');

  await subjectManager.notify(sub, { value: 1 });

  expect(multicastDispatcherMock).toBeCalledTimes(0);
  expect(loggerMethod).toBeCalledTimes(1);
});
