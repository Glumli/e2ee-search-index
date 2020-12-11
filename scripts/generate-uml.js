const { readdirSync, statSync, writeFileSync, readFileSync } = require("fs");

function getReferences(input) {
  let references = [];
  if (typeof input === "object") {
    Object.entries(input).forEach(([key, value]) => {
      if (key === "reference") {
        references = [...references, value];
      } else {
        references = [...references, ...getReferences(value)];
      }
    });
  }
  return references;
}

function writeDiagram(outputFile, resources, references) {
  let output = "@startuml graph\n";
  // output += "skinparam ArrowThickness 1\n";
  output += "skinparam Linetype ortho\n\n";
  Object.values(resources).forEach((resource) => {
    output += `class ${resource}\n`;
  });
  Object.entries(references).forEach(([key, refs]) => {
    refs.forEach((ref) => {
      if (resources[ref])
        output += `${resources[key]} -------------------------> ${resources[ref]}\n`;
    });
  });
  output += "@enduml";
  writeFileSync(outputFile, output);
}

function generateUML(inputDir, outputFile) {
  const references = {};
  const resources = {};
  readdirSync(inputDir).forEach((dirContent) => {
    const resource = JSON.parse(readFileSync(`${inputDir}${dirContent}`));
    references[resource.id] = getReferences(resource);
    resources[resource.id] = `${resource.resourceType}_${
      resource.id.split("-")[0]
    }`;
  });
  writeDiagram(outputFile, resources, references);
}

generateUML(
  `${__dirname}/../src/resources/synthea/resources/`,
  `${__dirname}/../out/uml/resourcegraph/resourcegraph.puml`
);
