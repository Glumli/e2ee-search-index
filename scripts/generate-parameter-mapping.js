const { readdirSync, statSync, writeFileSync, readFileSync } = require("fs");
const { resolve } = require("path");

const DEFINITION_FILE = `${__dirname}/../assets/search-parameters.json`;
const FILE_PATH = `${__dirname}/../src/parameterMapping.json`;

const definitions = JSON.parse(readFileSync(DEFINITION_FILE));
const mapping = definitions.entry.reduce((state, { resource }) => {
  resource.base.forEach((base) => {
    if (!state[base]) state[base] = {};
    // '|' is the character to seperate resources, the first element of the path is always the resourcetype itself
    state[base][resource.code] = resource.expression
      ?.split(" | ")
      .find((expression) => expression?.split(".")[0] === base)
      ?.split(".")
      .slice(1)
      .join(".");
  });
  return state;
}, {});

// TODO turn around the mapping ==> Allow queries without the baseresourcetype

writeFileSync(FILE_PATH, JSON.stringify(mapping));
