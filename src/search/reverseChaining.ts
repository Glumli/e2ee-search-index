import has from "lodash.has";
import { fetchResource, Resource } from "../sdk";
import {
  findReferences,
  getReferenceIdentifier,
  validate,
} from "../validation";
import { SearchAlgorithm } from "./search";
import { Query } from "../validation";
import { processQuery } from "../parameterMapping";

interface Index {
  [resourceId: string]: {
    resourceType: string;
    references: { id: string; path: string }[];
    identifier: string[];
    backreferences: { id: string; path: string }[];
  };
}

const getResourceIdentifier = (resource: Resource): string[] => {
  if (!resource.identifier) return [];
  return resource.identifier.reduce((current, identifier) => {
    return identifier.value ? [...current, identifier.value] : current;
  }, []);
};

const generateIndex = (resources: Resource[]) => {
  const index: Index = {};
  resources.forEach((resource) => {
    const references = findReferences(resource);
    // Iterates over the detected references and stores path and it it references
    const entries = references.reduce(
      (current, reference) => [
        ...current,
        ...getReferenceIdentifier(resource, reference.path).map((id) => ({
          path: reference.FHIRPath,
          id: id as string,
        })),
      ],
      []
    );

    entries.forEach((entry) => {
      index[entry.id] = {
        ...index[entry.id],
        backreferences: index[entry.id]
          ? [
              ...index[entry.id].backreferences,
              { path: entry.path, id: resource.id },
            ]
          : [{ path: entry.path, id: resource.id }],
      };
    });

    index[resource.id] = {
      references: entries,
      resourceType: resource.resourceType,
      identifier: getResourceIdentifier(resource),
      backreferences: [],
    };
  });

  Object.values(index)
    // iterate only over the complete entries
    .filter((value) => has(value, "identifier"))
    .forEach((value) => {
      value.identifier.forEach((id) => {
        // we assume that every identifier is unique
        if (has(index, id)) {
          const { backreferences } = index[id];
          value.backreferences = [...value.backreferences, ...backreferences];
          delete index[id];
        }
      });
    });
  return index;
};

const search = async (
  userId: string,
  query: Query,
  index: Index,
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
  const { basepath, target, targetpath } = processQuery(query);
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
        if (path === basepath) {
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

  return baseContext.filter((resource) =>
    validate(resource, query, targetContext)
  );
};

export default { preprocessing: generateIndex, search } as SearchAlgorithm;
