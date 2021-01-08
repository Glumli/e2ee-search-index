import { Query } from "../validation";
import { Resource } from "../sdk";
import bruteForce from "./bruteForce";
import refIndex from "./refIndex";
import resourceTypeIndex from "./resourceTypeIndex";

export interface SearchAlgorithm {
  preprocessing?: (resources: object[]) => object;
  search: (
    userId: string,
    query: Query,
    index: any,
    fetchResource: (userId: string, resourceId: string) => Promise<Resource>
  ) => Promise<object[]>;
  update?: (
    index: object,
    operation: "ADD" | "DELETE" | "UPDATE",
    resource: Resource
  ) => object;
}

export default { bruteForce, resourceTypeIndex, refIndex } as {
  [key: string]: SearchAlgorithm;
};
