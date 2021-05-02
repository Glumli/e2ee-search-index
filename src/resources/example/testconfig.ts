import resources00 from "./dataset0/testResources";
import resources01 from "./dataset1/testResources";

import testcases from "./testcases.json";

import { TestConfig } from "../testConfigInterface";

const config: TestConfig = {
  resources: {
    0: resources00,
    1: resources01,
  },
  testcases,
};

export default config;
