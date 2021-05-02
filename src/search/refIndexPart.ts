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

const generateIndex = (resources: Resource[] = []) =>
  resources.reduce((index, resource) => {
    return addResource(index, resource);
  }, {}) as RefIndex;

const search = async (
  userId: string,
  query: Query,
  index: RefIndex,
  fetchResource: (userId: string, resourceId: string) => Promise<Resource>,
  networkCall: () => void
) => {
  // Without any information we have to see all resources as the context.
  let baseContextIds = Object.keys(index);
  // let targetContextIds: string[] = [];
  const targetContextIds: { [key: string]: string[] } = {};

  if (query.base) {
    baseContextIds = baseContextIds.filter((id) => index[id].rT === query.base);
  }

  // TODO: Maybe adjust index to have the parameters instead of the paths?
  // Current: The path as mapped to is in the index
  const { basepath, target, basereferencepath, targetpath } = processQuery(
    query
  );

  if (target) {
    // id basereferencepath is set this one is used for the reference
    const referencingPath = basereferencepath ? basereferencepath : basepath;
    const filter: string[] = [];
    baseContextIds.forEach((baseId) => {
      const potentialBaseResource = index[baseId];
      const targetIds = potentialBaseResource.r.reduce((tIds, reference) => {
        // not the right reference
        if (referencingPath !== reference.p) {
          return tIds;
        }

        // target does not have the right resourceType
        const targetId = Object.keys(index).find(
          (tId) =>
            index[tId].rT === target &&
            (tId === reference.i ||
              index[tId].i.some((identifier) => identifier === reference.i))
        );

        return [...tIds, targetId];
      }, []);
      // resource does not have any reference we are looking for
      if (!targetIds.length) {
        filter.push(baseId);
        return;
      }
      // remember the baseIds so that we can directly return the baseIds for the matching targets
      targetIds.forEach((targetId) => {
        targetContextIds[targetId] = targetContextIds[targetId]
          ? [...targetContextIds[targetId], baseId]
          : [baseId];
      });
    });
    // filter out all the resources that can't match
    baseContextIds = baseContextIds.filter((id) => filter.indexOf(id) === -1);

    // TODO: Check if target can meet requirements
    if (query.modifier !== "_has") {
      networkCall();
      let targetContext = await Promise.all(
        Object.keys(targetContextIds).map((id) => fetchResource(userId, id))
      );
      targetContext = targetContext.filter((targetResource) =>
        validate(targetResource, {
          base: target,
          baseparameter: query.targetparameter,
          operator: query.operator,
          value: query.value,
        })
      );
      baseContextIds = targetContext.reduce((current, tC) => {
        return [...current, ...targetContextIds[tC.id]];
      }, []);
      networkCall();
      return Promise.all(baseContextIds.map((id) => fetchResource(userId, id)));
    } else {
      networkCall();
      let baseContext = await Promise.all(
        baseContextIds.map((id) => fetchResource(userId, id))
      );
      baseContext = baseContext.filter((baseResource) =>
        validate(baseResource, {
          base: query.base,
          baseparameter: query.baseparameter,
          operator: query.operator,
          value: query.value,
        })
      );
      baseContextIds = baseContext.map(({ id }) => id);
      const targetIds = Object.entries(targetContextIds).reduce(
        (current, [key, value]) => {
          if (value.some((id) => baseContextIds.indexOf(id) > -1)) {
            return [...current, key];
          }
          return current;
        },
        []
      );
      networkCall();
      return Promise.all(targetIds.map((id) => fetchResource(userId, id)));
    }
  }

  networkCall();
  const baseResources = await Promise.all(
    baseContextIds.map((id) => fetchResource(userId, id))
  );

  return baseResources.filter((resource) => validate(resource, query));
};

export default {
  preprocessing: generateIndex,
  search,
  update,
} as SearchAlgorithm;
