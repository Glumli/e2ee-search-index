import { fetchResource, Resource } from "../sdk";
import { findReferences, getReferenceIdentifierNew } from "../validation";
import { SearchAlgorithm } from "./search";
import { matches, Query } from "../validation";
import { splitQuery } from "../resourceUtils";

interface BasicIndex {
  [resourceId: string]: {
    resourceType: string;
    references: [{ id: string; path: string }];
    identifier: string[];
  };
}

const getResourceIdentifier = (resource: Resource): string[] => {
  if (!resource.identifier) return [];
  return resource.identifier.reduce((current, identifier) => {
    return identifier.value ? [...current, identifier.value] : current;
  }, []);
};

const generateIndex = (resources: Resource[]) => {
  return resources.reduce((index, resource) => {
    const references = findReferences(resource);
    const entries = references.map((reference) => ({
      path: reference,
      id: getReferenceIdentifierNew(resource, reference),
    }));
    return {
      ...index,
      [resource.id]: {
        references: entries,
        resourceType: resource.resourceType,
        identifier: getResourceIdentifier(resource),
      },
    };
  }, {});
};

const search = async (
  userId: string,
  password: string,
  query: Query,
  index: BasicIndex
) => {
  // Without any information we have to see all resources as the context.
  let baseContext = Object.keys(index);
  let targetContext: string[] = [];

  if (query.base) {
    baseContext = baseContext.filter(
      (id) => index[id].resourceType === query.base
    );
  }
  const { basePath, target, targetPath } = splitQuery(query.path);
  // If target is not set this means that there is no reference
  // TODO: What if target === base? ==> As working with ids only this should not be an issue
  if (target) {
    const tempTargetContext = Object.keys(index).filter(
      (id) => index[id].resourceType === target
    );

    // TODO: not super clean, as IMO filter should not have sideeffects
    baseContext = baseContext.filter((id) => {
      let returnValue = false;
      // .some as we expect every identifier to only be used once
      index[id].references.some(({ path, id }) => {
        if (path === basePath) {
          const matchingTarget = tempTargetContext.find(
            (targetId) =>
              targetId === id ||
              index[targetId].identifier.some((identifier) => identifier === id)
          );
          if (matchingTarget) {
            targetContext.push(matchingTarget);
            returnValue = true;
          }
        }
      });
      return returnValue;
    });
  }

  const contextIds = Array.from(new Set([...baseContext, ...targetContext]));

  const context = await Promise.all(
    contextIds.map((id) => fetchResource(userId, password, id))
  );

  return context.filter((resource) => matches(resource, query, context));
};

export default { preprocessing: generateIndex, search } as SearchAlgorithm;
