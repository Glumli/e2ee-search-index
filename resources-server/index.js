const express = require("express");
const app = express();
var cors = require("cors");
const process = require("process");
const fs = require("fs");

app.use(cors());

const PORT = 8080;

const loadResources = (cohort, user) => {
  const resources = {};
  fs.readdirSync(`./resources/${cohort}/${user}`).forEach((file) => {
    if (file.startsWith("testResources")) return;

    const resource = fs.readFileSync(`./resources/${cohort}/${user}/${file}`);
    resources[file.split(".")[0]] = JSON.parse(resource);
  });
  return resources;
};

app.get("/resources/:cohort/:user", (req, res) => {
  let { cohort, user } = req.params;
  console.log(cohort, user);
  try {
    let resources = loadResources(cohort, user);
    res.status(200).json(JSON.stringify(resources));
    resources = {};
  } catch (e) {
    res.status(200).json(JSON.stringify({}));
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
