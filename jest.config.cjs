module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/server'],
  testMatch: ['**/*.test.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/server/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1'
  },
  setupFiles: ['<rootDir>/server/test/setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(dotenv)/)'
  ]
};