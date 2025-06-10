module.exports = {
    preset: 'ts-jest/presets/js-with-ts-esm', // Se estiver usando TypeScript
    testEnvironment: 'node',
    transform: {},
    extensionsToTreatAsEsm: ['.js'],
    globals: {
      'ts-jest': {
        useESM: true,
      },
    },
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
  };