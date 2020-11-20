const { getFiles } = require("./generate-resources-file");
const { readFileSync, writeFileSync } = require("fs");

function getResourcesFromBundle(bundle) {
  return bundle.entry.map((entry) => entry.resource);
}

function splitBundlesToResources(inputDir, outputDir) {
  const bundleFiles = getFiles(inputDir);
  let resources = [];
  bundleFiles.forEach((bundleFile) => {
    const bundle = JSON.parse(readFileSync(bundleFile));
    resources = [...resources, ...getResourcesFromBundle(bundle)];
  });
  resources.forEach((resource) =>
    writeFileSync(
      `${outputDir}/${resource.resourceType}${resource.id}.json`,
      JSON.stringify(resource).replaceAll(
        '"reference":"urn:uuid:',
        '"reference":"'
      )
    )
  );
}

module.exports = { splitBundlesToResources };
