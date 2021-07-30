const fs = require("fs");
const { generateResourcesFile } = require("./utils/generate-resources-file");
const {
  splitBundlesToResources,
} = require("./utils/split-bundles-to-resources");

const datasets = ["01"];

datasets.forEach((dataset) => {
  const SYNTHEA_DIR = `${__dirname}/../src/resources/synthea_example/${dataset}`;
  const BUNDLES_DIR = `${SYNTHEA_DIR}/bundles`;
  const RESOURCES_DIR = `${SYNTHEA_DIR}/resources`;
  const FILE_PATH = `${SYNTHEA_DIR}/testResources.ts`;

  if (!fs.existsSync(RESOURCES_DIR)) {
    fs.mkdirSync(RESOURCES_DIR);
  }
  splitBundlesToResources(BUNDLES_DIR, RESOURCES_DIR);
  generateResourcesFile(RESOURCES_DIR, FILE_PATH);
});
