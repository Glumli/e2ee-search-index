const { readdirSync, statSync, writeFileSync, readFileSync } = require("fs");
const { resolve } = require("path");

const DEFINITION_FILE = `${__dirname}/../assets/search-parameters.json`;
const FILE_PATH = `${__dirname}/../src/parameterMapping.json`;

const definitions = JSON.parse(readFileSync(DEFINITION_FILE));
const mapping = definitions.entry.reduce((state, { resource }) => {
  resource.base.forEach((base) => {
    if (!state[base]) state[base] = {};
    state[base][resource.code] = resource.expression
      ?.split(" | ")
      .find((expression) => expression?.split(".")[0] === base)
      ?.split(".")
      .slice(1)
      .join(".");
  });
  return state;
}, {});

writeFileSync(FILE_PATH, JSON.stringify(mapping));
