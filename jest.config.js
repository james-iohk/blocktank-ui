module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
  moduleDirectories: ['node_modules', 'src'],
  transformIgnorePatterns: ["node_modules\/(?!axios)"], // this needed appending to react-scripts test in package.json
};
