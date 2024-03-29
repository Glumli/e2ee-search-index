const { readdirSync, statSync, writeFileSync } = require("fs");
const { resolve } = require("path");

const getVariableName = (path) =>
  path
    .split("/")
    [path.split("/").length - 1].split(/-|\./)
    .slice(0, -1)
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
    .join("");

function getFiles(dirname) {
  let files = [];
  readdirSync(dirname).forEach((dirContent) => {
    const contentPath = resolve(dirname, dirContent);
    const contentStat = statSync(contentPath);
    if (contentStat.isDirectory()) {
      const dirFiles = getFiles(`${dirname}/${dirContent}`);
      files = [...files, ...dirFiles];
    } else {
      files.push(contentPath);
    }
  });
  return files;
}

function generateResourcesFile(inputDir, outputFile) {
  const files = getFiles(inputDir);
  let code = "";
  files.forEach((file) => {
    const variableName = getVariableName(file);
    code = `${code}import ${variableName} from "${file}";\n`;
  });
  code = `${code}\nexport default {\n`;
  files.forEach((file) => {
    const variableName = getVariableName(file);
    code = `${code}  ${variableName},\n`;
  });
  code = `${code}};\n`;

  writeFileSync(outputFile, code);
}

module.exports = { generateResourcesFile, getFiles };
