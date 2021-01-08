import { Resource } from "../sdk";
import { validate, getResourceIdentifier, Query } from "../validation";
import { SearchAlgorithm } from "./search";
import { processQuery } from "../parameterMapping";

interface ResourceTypeIndex {
  [resourceId: string]: {
    resourceType: string;
    identifier: string[];
  };
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
  return {
    ...index,
    [resource.id]: {
      resourceType: resource.resourceType,
      identifier: getResourceIdentifier(resource),
    },
  };
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
  fetchResource: (userId: string, resourceId: string) => Promise<Resource>
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
    baseContextIds = baseContextIds.filter(
      (id) => index[id].resourceType === base
    );
  }

  // If target is not set this means that there is no reference
  if (target) {
    targetContextIds = Object.keys(index).filter(
      (id) => index[id].resourceType === target
    );
  }

  const contextIds = Array.from(
    new Set([...baseContextIds, ...targetContextIds])
  );

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
