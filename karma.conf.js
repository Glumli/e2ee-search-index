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
      outputPath: "out/log/", // default name is current directory
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
    browserNoActivityTimeout: 600000,
    browserDisconnectTimeout: 600000,
    browserDisconnectTolerance: 20,
    concurrency: 1,

    client: {
      jasmine: {
        timeoutInterval: 600000,
      },
    },
  });
};
