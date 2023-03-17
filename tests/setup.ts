import { beforeAll, afterEach, vi } from 'vitest';
import { noopLogger } from '@flexbase/logger';
import { subjectManager } from '../src/index';

beforeAll(() => {
  subjectManager.logger = noopLogger;
});

afterEach(() => {
  vi.clearAllMocks();
});

export {};
