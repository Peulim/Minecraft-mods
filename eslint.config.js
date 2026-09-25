const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["dist/**", ".expo/**", "node_modules/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
];
