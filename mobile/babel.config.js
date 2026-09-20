module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'react' }]],
    plugins: [
      // Must stay last — Reanimated's plugin rewrites worklets and breaks if
      // another plugin runs after it.
      'react-native-reanimated/plugin',
    ],
  };
};
