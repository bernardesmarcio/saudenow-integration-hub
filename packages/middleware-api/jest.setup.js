// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Learn more: https://jestjs.io/docs/configuration#setupfilesafterenv-array

// Mock environment variables for tests
process.env.NODE_ENV = "test";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.ENVIRONMENT = "development";
process.env.SCHEMA_PREFIX = "dev_";

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
