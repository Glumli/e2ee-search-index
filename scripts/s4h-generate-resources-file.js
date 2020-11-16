const { generateResourcesFile } = require("./utils/generate-resources-file");

const RESOURCES_DIR = `${__dirname}/../src/resources/s4h`;
const FILE_PATH = `${__dirname}/../src/resources/testResources.ts`;

generateResourcesFile(RESOURCES_DIR, FILE_PATH);
