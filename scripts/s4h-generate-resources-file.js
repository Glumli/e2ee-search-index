const { generateResourcesFile } = require("./utils/generate-resources-file");

const RESOURCES_DIR = `${__dirname}/../src/resources/s4h/resources`;
const FILE_PATH = `${__dirname}/../src/resources/s4h/testResources.ts`;

generateResourcesFile(RESOURCES_DIR, FILE_PATH);
