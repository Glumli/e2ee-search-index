const fs = require("fs");
const { generateResourcesFile } = require("./utils/generate-resources-file");
const {
  splitBundlesToResources,
} = require("./utils/split-bundles-to-resources");

const years = [
  "05",
  "10",
  "15",
  "20",
  "25",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
  "60",
  "65",
  "70",
  "75",
];

["2010"].forEach((year) => {
  const SYNTHEA_DIR = `${__dirname}/../src/resources/testcases/${year}`;
  const BUNDLES_DIR = `${SYNTHEA_DIR}/bundles`;
  const RESOURCES_DIR = `${SYNTHEA_DIR}/resources`;
  const FILE_PATH = `${SYNTHEA_DIR}/testResources.ts`;

  if (!fs.existsSync(RESOURCES_DIR)) {
    fs.mkdirSync(RESOURCES_DIR);
  }
  splitBundlesToResources(BUNDLES_DIR, RESOURCES_DIR);
  generateResourcesFile(RESOURCES_DIR, FILE_PATH);
});
