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
    rT: string; // resourceType
    r: { i: string; p: string }[]; // references
    i: string[];
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
        p: reference.FHIRPath,
        i: id,
      })),
    ],
    []
  );

  index[resource.id] = {
    r: entries,
    rT: resource.resourceType,
    i: getResourceIdentifier(resource),
  };
  return index;
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
  fetchResource: (userId: string, resourceId: string) => Promise<Resource>,
  networkCall: () => void
) => {
  // Without any information we have to see all resources as the context.
  let baseContextIds = Object.keys(index);
  let targetContextIds: string[] = [];

  if (query.base) {
    baseContextIds = baseContextIds.filter((id) => index[id].rT === query.base);
  }

  // TODO: Maybe adjust index to have the parameters instead of the paths?
  // Current: The path as mapped to is in the index
  const { basepath, target, basereferencepath, targetpath } = processQuery(
    query
  );
  // If target is not set this means that there is no reference
  if (target) {
    // id basereferencepath is set this one is used for the reference
    const referencingPath = basereferencepath ? basereferencepath : basepath;

    const tempTargetContext = Object.keys(index).filter(
      (id) => index[id].rT === target
    );

    // TODO: not super clean, as IMO filter should not have sideeffects
    baseContextIds = baseContextIds.filter((baseId) => {
      let returnValue = false;
      // .some as we expect every identifier to only be used once
      index[baseId].r.some(({ p: path, i: id }) => {
        if (path === referencingPath) {
          const matchingTarget = tempTargetContext.find(
            (targetId) =>
              targetId === id ||
              index[targetId].i.some((identifier) => identifier === id)
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
