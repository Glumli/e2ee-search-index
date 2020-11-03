import { Query } from "../validation";
import bruteForce from "./bruteForce";

export interface SearchAlgorithm {
  preprocessing?: (resources: object[]) => object;
  search: (userId: string, password: string, query: Query) => Promise<object[]>;
}

export default { bruteForce } as { [key: string]: SearchAlgorithm };
