import testcases from "./testcases/testcases";
import testCohorts from "./testCohorts";

import { TestConfig } from "../testConfigInterface";

const config: TestConfig = {
  cohorts: testCohorts,
  testcases,
};

export default config;
