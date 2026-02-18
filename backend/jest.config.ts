import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['**/*.ts', '!**/index.ts', '!**/*.d.ts'],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: { lines: 70, functions: 70 },
  },
  setupFilesAfterFramework: [],
};

export default config;
