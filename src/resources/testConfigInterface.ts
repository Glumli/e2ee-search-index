import { Resource } from "../sdk";
import { Query } from "../validation";

export interface TestQuery extends Query {
  id: string;
}

export interface TestCase {
  query: TestQuery;
  description?: string;
}

export interface TestConfig {
  cohorts: {
    [cohortName: string]: string[];
  };
  testcases: { [key: string]: TestCase[] };
}

export interface patientResources {
  [resourceId: string]: Resource;
}
