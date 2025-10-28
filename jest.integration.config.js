module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/integration/**/*.test.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/__tests__/setup.ts',
    '/src/__tests__/helpers/',
    '/src/__tests__/services/',
    '/src/__tests__/controllers/'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        resolveJsonModule: true
      },
      transpilation: true
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/generated/**',
    '!src/server.ts',
    '!src/app.ts'
  ],
  coverageDirectory: 'coverage-integration',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000, // Longer timeout for integration tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  watchman: false,
  watchPathIgnorePatterns: ['<rootDir>/node_modules/'],
  // Use test database for integration tests
  globalSetup: '<rootDir>/src/__tests__/integration/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/integration/global-teardown.ts'
};
