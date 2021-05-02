const { readdirSync, statSync, writeFileSync, readFileSync } = require("fs");

const stat = require("../out/synthea1.json");

const outputFile = `${__dirname}/../out/synthea_tabular.tex`;

const resourceTypeMapping = {
  Observation: "Obs",
  Claim: "Cl",
  Encounter: "E",
  ExplanationOfBenefit: "EoB",
  DiagnosticReport: "DR",
  Immunization: "I",
  Procedure: "P",
  MedicationRequest: "MR",
  Condition: "Co",
  CarePlan: "CP",
  CareTeam: "CT",
  Organization: "Org",
  Practitioner: "Prac",
  ImagingStudy: "IS",
  Patient: "Pat",
};

let output = "";

output += "\\begin{tabular}{|l||c||";

let resourceTypes = [];
Object.keys(stat.resources).forEach((resourcetype) => {
  output += "c|";
  resourceTypes.push({
    resourcetype,
    count: stat.resources[resourcetype].totalResources,
  });
});
output += "}\n";

resourceTypes.sort(function (a, b) {
  return a.count > b.count ? -1 : a.count == b.count ? 0 : 1;
});
resourceTypes = resourceTypes.reduce(
  (out, rt) => [...out, rt.resourcetype],
  []
);

let references = Object.entries(stat.references).map(([key, value]) => ({
  ref: key,
  count: value,
}));
references.sort(function (a, b) {
  return a.count > b.count ? -1 : a.count == b.count ? 0 : 1;
});
references = references.reduce((out, rt) => [...out, rt.ref], []);

// HEAD
output += "\\hline\n & total ";
resourceTypes.forEach((rt) => {
  output += `& ${resourceTypeMapping[rt] ? resourceTypeMapping[rt] : rt} `;
});
output += "\\\\ \n \\hline \n \\hline \n";

// META
["totalResources", "totalReferences", "avg"].forEach((row) => {
  const val = row == "avg" ? stat[row].toFixed(2) : stat[row];
  output += `${row} & ${val}`;

  resourceTypes.forEach((rt) => {
    const val =
      row == "avg"
        ? stat.resources[rt][row].toFixed(2)
        : stat.resources[rt][row];
    output += `& ${val} `;
  });
  output += "\\\\ \n \\hline \n";
});
output += "\\hline \n";

// REFERENCES
references.forEach((ref) => {
  output += `${ref} & ${stat.references[ref]} `;

  resourceTypes.forEach((rt) => {
    const count = stat.resources[rt].references[ref];
    output += ` & ${count ? count : 0}`;
  });
  output += "\\\\ \n \\hline \n";
});

output += "\\end{tabular}";
console.log(output);

writeFileSync(outputFile, output);
