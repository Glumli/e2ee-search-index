import get from "lodash.get";
import isUndefined from "lodash.isundefined";
import { Resource } from "./sdk";
import { QUERY_ERROR } from "./resourceUtils";

export interface Query {
  base?: string;
  path: string;
  operator: string;
  value: any;
}

const isIdentifier = (identifier: object) => {
  const isObject = typeof identifier === "object";
  if (!isObject) return false;

  const IDENTIFIER_KEYS = [
    "id",
    "extension",
    "use",
    "type",
    "system",
    "value",
    "period",
    "assigner",
  ];
  const hasUnallowedKeys = Object.keys(identifier).some(
    (key) => IDENTIFIER_KEYS.indexOf(key) === -1
  );
  if (hasUnallowedKeys) return false;

  return true;
};

const isReferenceNew = (reference: { identifier: object }) => {
  const isObject = typeof reference === "object";
  if (!isObject) return false;

  const REFERENCE_KEYS = ["reference", "type", "identifier", "display"];
  const hasUnallowedKeys = Object.keys(reference).some(
    (key) => REFERENCE_KEYS.indexOf(key) === -1
  );
  if (hasUnallowedKeys) return false;

  if (reference.identifier && !isIdentifier(reference.identifier)) return false;

  return true;
};

export const findReferences = (
  object: { [key: string]: any },
  path = ""
): string[] => {
  return Object.keys(object).reduce((current: string[], key) => {
    const currentPath = path ? `${path}.${key}` : key;
    if (isReferenceNew(object[key])) {
      current.push(currentPath);
    } else if (typeof object[key] === "object") {
      current = [...current, ...findReferences(object[key], currentPath)];
    }

    return current;
  }, []);
};

export const getReferenceIdentifierNew = (resource: Resource, path: string) => {
  const reference = get(resource, path);
  if (!reference) return false;
  return reference.reference || reference.identifier?.value;
};

// TODO: Clean up and split
export const getReferenceIdentifier = (resource: object, path: string) => {
  const splitPath = path.split(".");
  for (let i = 1; i < splitPath.length; i++) {
    let pathValue = get(resource, splitPath.slice(0, i).join("."));

    // When any value before inding a reference is undefined we know that the rsource won't match
    if (isUndefined(pathValue)) return [false, ""];

    if (isReferenceNew(pathValue)) {
      return [
        pathValue?.identifier?.value || pathValue?.reference,
        splitPath.slice(i, splitPath.length).join("."),
      ];
    }
  }
};

const getReference = (identifier: string, resources: Resource[]) => {
  return resources.find(
    (resource) =>
      resource.id === identifier ||
      resource.identifier?.some((id) => id.value === identifier)
  );
};

export const matches = (
  resource: Resource,
  query: Query,
  context?: Resource[]
): boolean => {
  if (query.base && query.base !== resource.resourceType) return false;

  const splitPath = query.path.split(":");
  const basePath = splitPath[0];
  // Query contains a reference
  if (splitPath.length > 1) {
    // More than two ":"
    if (splitPath.length > 2) throw new Error(QUERY_ERROR);

    const remainder = splitPath[1].split(".");
    // No query after the target resourceType
    if (remainder.length < 2) throw new Error(QUERY_ERROR);

    const [target, ...path] = remainder;
    const targetPath = path.join(".");
    const referenceIdentifier = getReferenceIdentifierNew(resource, basePath);
    if (!referenceIdentifier) return false;

    const reference = getReference(referenceIdentifier, context);
    if (!reference) return false;

    return matches(reference, { ...query, base: target, path: targetPath });
  }
  const resourceValue = get(resource, basePath);
  // No value found for the given path
  if (isUndefined(resourceValue)) return false;

  switch (query.operator) {
    case "eq":
      return resourceValue === query.value;
    default:
      throw new Error(`Operator ${query.operator} is not implemented yet.`);
  }
};
