module.exports = function (config) {
  config.set({
    frameworks: ["jasmine", "karma-typescript"],

    files: [{ pattern: "src/**/*.ts" }],

    preprocessors: {
      "src/**/*.ts": ["karma-typescript"],
    },
    karmaTypescriptConfig: {
      tsconfig: "./tsconfig.json",
      coverageOptions: {
        instrumentation: false,
      },
    },

    reporters: ["mocha", "karma-typescript"],

    browsers: ["ChromeHeadless"],
  });
};
