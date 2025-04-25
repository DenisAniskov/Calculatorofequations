export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'jsx'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(module-that-needs-to-be-transformed)/)'
  ]
}; 