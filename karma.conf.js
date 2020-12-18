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
      bundlerOptions: {
        sourceMap: true,
      },
    },

    reporters: ["mocha", "karma-typescript"],

    browsers: ["ChromeHeadless"],

    client: {
      jasmine: {
        timeoutInterval: 15000,
      },
    },
  });
};
