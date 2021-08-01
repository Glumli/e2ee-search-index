const express = require("express");
const app = express();
var cors = require("cors");

app.use(cors());

const PORT = 8080;

app.get("/resources/:cohort/:user", (req, res) => {
  let { cohort, user } = req.params;
  console.log(cohort, user);
  let resources = require(`./resources/${cohort}/${user}/testResources.js`);
  res.status(200).json(JSON.stringify(resources));
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
