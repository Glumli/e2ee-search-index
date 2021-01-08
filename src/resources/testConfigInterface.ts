import { Resource } from "../sdk";
import { Query } from "../validation";

export interface TestQuery extends Query {
  id: string;
}

export interface TestCase {
  query: TestQuery;
  result: { [testConfigName: string]: { length: number } };
  description?: string;
}

export interface TestConfig {
  resources: {
    [testConfigName: string]: {
      [resourceId: string]: Resource;
    };
  };
  testcases: TestCase[];
}
