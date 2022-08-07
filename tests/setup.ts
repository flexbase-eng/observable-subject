import { noopLogger } from '@flexbase/logger';
import { subjectManager } from '../src/index';

beforeAll(() => {
  subjectManager.logger = noopLogger;
});

afterEach(() => {
  jest.clearAllMocks();
});

export {};
