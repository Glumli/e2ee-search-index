const { generateResourcesFile } = require("./utils/generate-resources-file");
const {
  splitBundlesToResources,
} = require("./utils/split-bundles-to-resources");

const SYNTHEA_DIR = `${__dirname}/../src/resources/synthea`;
const BUNDLES_DIR = `${SYNTHEA_DIR}/bundles`;
const RESOURCES_DIR = `${SYNTHEA_DIR}/resources`;
const FILE_PATH = `${__dirname}/../src/resources/testResources.ts`;

splitBundlesToResources(BUNDLES_DIR, RESOURCES_DIR);
generateResourcesFile(RESOURCES_DIR, FILE_PATH);