module.exports = function (config) {
  config.set({
    frameworks: ["jasmine", "karma-typescript", "mocha"],

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

    logReporter: {
      outputPath: "out/", // default name is current directory
      logFileName: "logfile.log", // default name is logFile_month_day_year_hr:min:sec.log
      filter_key: "log-filter",
    },

    plugins: [
      "karma-log-reporter",
      "karma-typescript",
      "karma-jasmine",
      "karma-mocha",
      "karma-mocha-reporter",
      "karma-chrome-launcher",
    ],
    reporters: ["mocha", "karma-typescript", "log-reporter"],

    browsers: ["ChromeHeadless"],
    browserNoActivityTimeout: 120000,
    browserDisconnectTimeout: 120000,
    browserDisconnectTolerance: 20,

    client: {
      jasmine: {
        timeoutInterval: 120000,
      },
    },
  });
};
