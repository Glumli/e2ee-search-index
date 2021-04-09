const { writeFileSync } = require("fs");
const resultA = require("../src/resources/testcases/results/41_99_3");
const resultB = require("../src/resources/testcases/results/38_3");

const outputFile = `${__dirname}/../src/resources/testcases/results/merged.json`;

const mergedResult = {};
Object.keys(resultA).forEach((key) => {
  mergedResult[key] = { ...resultA[key], ...resultB[key] };
});

writeFileSync(outputFile, JSON.stringify(mergedResult, null, 2));
