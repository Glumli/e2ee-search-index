import { Query } from "../validation";
import bruteForce from "./bruteForce";
import basicIndex from "./basicIndex";

export interface SearchAlgorithm {
  preprocessing?: (resources: object[]) => object;
  search: (
    userId: string,
    password: string,
    query: Query,
    index: any
  ) => Promise<object[]>;
}

export default { bruteForce, basicIndex } as {
  [key: string]: SearchAlgorithm;
};
