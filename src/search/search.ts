import { Query } from "../validation";
import { Resource } from "../sdk";
import bruteForce from "./bruteForce";
import refIndex from "./refIndex";
import resourceTypeIndex from "./resourceTypeIndex";
import refIndexPart from "./refIndexPart";

export interface SearchAlgorithm {
  preprocessing?: (resources: object[]) => object;
  search: (
    userId: string,
    query: Query,
    index: any,
    fetchResource: (userId: string, resourceId: string) => Promise<Resource>,
    callCounter?: () => void
  ) => Promise<object[]>;
  update?: (
    index: object,
    operation: "ADD" | "DELETE" | "UPDATE",
    resource: Resource
  ) => object;
}

export default {
  bruteForce,
  resourceTypeIndex,
  referenceIndex: refIndex,
  referenceIndexNew: refIndexPart,
} as {
  [key: string]: SearchAlgorithm;
};
