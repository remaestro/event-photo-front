module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/e2e'],
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/e2e/jest.setup.ts'],
  testTimeout: 60000,
  verbose: true,
  collectCoverage: false,
  moduleFileExtensions: ['ts', 'js', 'json'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
};