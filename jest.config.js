
module.exports = {
  preset: 'ts-jest',
  testEnvironment: "jest-environment-jsdom",
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  testMatch: [
    '**/test/**/*.spec.ts',
    '**/test/**/*.spec.tsx'
  ],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '<rootDir>/src/**/*.tsx',
    '!<rootDir>/src/types/**/*.ts',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: false,
      isolatedModules: true,
    }]
  },
  setupFiles: ["<rootDir>/jest.polyfills.js"],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts']
};
