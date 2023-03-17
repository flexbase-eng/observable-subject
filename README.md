# observable-subject

[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=flexbase-eng_observable-subject&metric=coverage)](https://sonarcloud.io/summary/new_code?id=flexbase-eng_observable-subject)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=flexbase-eng_observable-subject&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=flexbase-eng_observable-subject)

Observable subject event bus

## Installation

```
npm install @flexbase/observable-subject
```

or

```
yarn add @flexbase/observable-subject
```

## Usage

```ts
import { Subject, subjectManager } from '@flexbase/observable-subject';

// create a subject
const subject: Subject = { key: Symbol() };

// register the subject
await subjectManager.register(subject);

// subscribe to the subject
const subscription = subjectManager.subscribe<number>(subject, async context => {
  await new Promise(_ => setTimeout(_, context.value));
});

// notify subscriptions
await subjectManager.notify(subject, { value: 1000 });

// unsubscribe
subscription.unsubscribe();
```
