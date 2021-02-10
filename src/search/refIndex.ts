import { Resource } from "../sdk";
import {
  findReferences,
  getReferenceIdentifier,
  validate,
  getResourceIdentifier,
  Query,
} from "../validation";
import { SearchAlgorithm } from "./search";
import { processQuery } from "../parameterMapping";

interface RefIndex {
  [resourceId: string]: {
    resourceType: string;
    references: { id: string; path: string }[];
    identifier: string[];
  };
}

const deleteResource = (index: RefIndex, resource: Resource): RefIndex => {
  const updatedIndex = { ...index };
  delete updatedIndex[resource.id];
  return updatedIndex;
};

const updateResource = (index: RefIndex, resource: Resource): RefIndex => {
  const updatedIndex = { ...index };
  delete updatedIndex[resource.id];
  return addResource(updatedIndex, resource);
};

const addResource = (index: RefIndex, resource: Resource): RefIndex => {
  const references = findReferences(resource);
  const entries = references.reduce(
    (current, reference): { id: string; path: string }[] => [
      ...current,
      ...getReferenceIdentifier(resource, reference.path).map((id) => ({
        path: reference.FHIRPath,
        id: id,
      })),
    ],
    []
  );

  return {
    ...index,
    [resource.id]: {
      references: entries,
      resourceType: resource.resourceType,
      identifier: getResourceIdentifier(resource),
    },
  };
};

const update = (
  index: RefIndex,
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

const generateIndex = (resources: Resource[] = []) => {
  return resources.reduce((index, resource) => {
    return addResource(index, resource);
  }, {});
};

const search = async (
  userId: string,
  query: Query,
  index: RefIndex,
  fetchResource: (userId: string, resourceId: string) => Promise<Resource>
) => {
  // Without any information we have to see all resources as the context.
  let baseContextIds = Object.keys(index);
  let targetContextIds: string[] = [];

  if (query.base) {
    baseContextIds = baseContextIds.filter(
      (id) => index[id].resourceType === query.base
    );
  }

  // TODO: Maybe adjust index to have the parameters instead of the paths?
  // Current: The path as mapped to is in the index
  const { basepath, target, basereferencepath, targetpath } = processQuery(
    query
  );
  // If target is not set this means that there is no reference
  if (target) {
    const tempTargetContext = Object.keys(index).filter(
      (id) => index[id].resourceType === target
    );

    // TODO: not super clean, as IMO filter should not have sideeffects
    baseContextIds = baseContextIds.filter((id) => {
      let returnValue = false;
      // .some as we expect every identifier to only be used once
      index[id].references.some(({ path, id }) => {
        if (path === basereferencepath || path === basepath) {
          const matchingTarget = tempTargetContext.find(
            (targetId) =>
              targetId === id ||
              index[targetId].identifier.some((identifier) => identifier === id)
          );
          if (matchingTarget) {
            targetContextIds.push(matchingTarget);
            returnValue = true;
          }
        }
      });
      return returnValue;
    });
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
