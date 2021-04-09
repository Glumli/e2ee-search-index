import { Resource } from "../sdk";
import { validate, Query } from "../validation";
import { SearchAlgorithm } from "./search";
import { processQuery } from "../parameterMapping";

interface ResourceTypeIndex {
  [resourceId: string]: string;
}

const deleteResource = (
  index: ResourceTypeIndex,
  resource: Resource
): ResourceTypeIndex => {
  const updatedIndex = { ...index };
  delete updatedIndex[resource.id];
  return updatedIndex;
};

const updateResource = (
  index: ResourceTypeIndex,
  resource: Resource
): ResourceTypeIndex => {
  const updatedIndex = { ...index };
  delete updatedIndex[resource.id];
  return addResource(updatedIndex, resource);
};

const addResource = (
  index: ResourceTypeIndex,
  resource: Resource
): ResourceTypeIndex => {
  index[resource.id] = resource.resourceType;
  return index;
};

const update = (
  index: ResourceTypeIndex,
  operation: "ADD" | "DELETE" | "UPDATE",
  resource: Resource
) => {
  switch (operation) {
    case "ADD":
      return addResource(index, resource);
    case "DELETE":
      return deleteResource(index, resource);
    case "UPDATE":
      return updateResource(index, resource);
    default:
      break;
  }
};

const generateIndex = (resources: Resource[]) => {
  return resources.reduce((index, resource) => {
    return addResource(index, resource);
  }, {});
};

const search = async (
  userId: string,
  query: Query,
  index: ResourceTypeIndex,
  fetchResource: (userId: string, resourceId: string) => Promise<Resource>,
  networkCall: () => void
) => {
  // Without any information we have to see all resources as the context.
  let baseContextIds = Object.keys(index);
  let targetContextIds: string[] = [];

  const {
    base,
    basepath,
    target,
    basereferencepath,
    targetpath,
  } = processQuery(query);

  if (base) {
    baseContextIds = baseContextIds.filter((id) => index[id] === base);
  }

  // If target is not set this means that there is no reference
  if (target) {
    targetContextIds = Object.keys(index).filter((id) => index[id] === target);
  }

  const contextIds = Array.from(
    new Set([...baseContextIds, ...targetContextIds])
  );

  networkCall();
  const context = await Promise.all(
    contextIds.map((id) => fetchResource(userId, id))
  );

  const baseContext = context.filter(
    ({ id }) => baseContextIds.indexOf(id) > -1
  );

  const targetContext = context.filter(
    ({ id }) => targetContextIds.indexOf(id) > -1
  );

  return query.modifier !== "_has"
    ? baseContext.filter((resource) => validate(resource, query, targetContext))
    : targetContext.filter((resource) =>
        validate(resource, query, baseContext)
      );
};

export default {
  preprocessing: generateIndex,
  search,
  update,
} as SearchAlgorithm;
