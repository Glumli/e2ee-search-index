const {
  getFiles,
  generateResourcesFile,
} = require("./utils/generate-resources-file");
const { readFileSync, writeFileSync } = require("fs");

function splitArrayToResources(inputDir, outputDir) {
  const arrayFiles = getFiles(inputDir);
  let resources = [];
  arrayFiles.forEach((arrayFile) => {
    const array = JSON.parse(readFileSync(arrayFile));
    resources = [...resources, ...array];
  });
  resources.forEach((resource) =>
    writeFileSync(
      `${outputDir}/${resource.resourceType}${resource.id}.json`,
      JSON.stringify(resource, null, 2).replace(
        /"reference": "urn:uuid:/g,
        '"reference": "'
      )
    )
  );
}

const GENETIC_DIR = `${__dirname}/../src/resources/genetic/`;
const BUNDLES_DIR = `${GENETIC_DIR}/bundles`;
const RESOURCES_DIR = `${GENETIC_DIR}/resources`;
const FILE_PATH = `${GENETIC_DIR}/testResources.ts`;

splitArrayToResources(BUNDLES_DIR, RESOURCES_DIR);
generateResourcesFile(RESOURCES_DIR, FILE_PATH);
