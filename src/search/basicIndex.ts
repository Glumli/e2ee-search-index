import { fetchResource, Resource } from "../sdk";
import {
  findReferences,
  getReferenceIdentifier,
  validate,
  getResourceIdentifier,
} from "../validation";
import { SearchAlgorithm } from "./search";
import { matches, Query } from "../validation";
import { splitQuery } from "../resourceUtils";
import { processQuery } from "../parameterMapping";

interface BasicIndex {
  [resourceId: string]: {
    resourceType: string;
    references: [{ id: string; path: string }];
    identifier: string[];
  };
}

const generateIndex = (resources: Resource[]) => {
  return resources.reduce((index, resource) => {
    const references = findReferences(resource);
    const entries = references.reduce(
      (current, reference) => [
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
  }, {});
};

const search = async (
  userId: string,
  password: string,
  query: Query,
  index: BasicIndex
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
    contextIds.map((id) => fetchResource(userId, password, id))
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

export default { preprocessing: generateIndex, search } as SearchAlgorithm;
