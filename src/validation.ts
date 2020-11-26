import get from "lodash.get";
import isUndefined from "lodash.isundefined";
import isArray from "lodash.isarray";
import has from "lodash.has";
import { Resource } from "./sdk";
import { QUERY_ERROR } from "./resourceUtils";
import { processQuery } from "./parameterMapping";

export interface Query {
  base: string;
  baseparameter: string;
  target?: string;
  targetparameter?: string;
  operator: string;
  value: any;
}

export interface ProcessedQuery {
  base?: string;
  basepath: string;
  target?: string;
  targetpath?: string;
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

// returns an object with two different paths as FHIR paths ignore weather a property is an array or not.
export const findReferences = (
  object: { [key: string]: any },
  { path = "", FHIRPath = "" } = {}
): { path: string; FHIRPath: string }[] => {
  const oIsArray = isArray(object);
  return Object.keys(object).reduce(
    (current: { path: string; FHIRPath: string }[], key) => {
      const currentPath = path ? `${path}.${key}` : key;
      const currentFHIRPath = oIsArray
        ? FHIRPath
        : FHIRPath
        ? `${FHIRPath}.${key}`
        : key;
      const res = { path: currentPath, FHIRPath: currentFHIRPath };
      if (isReferenceNew(object[key])) {
        current.push(res);
      } else if (typeof object[key] === "object") {
        current = [...current, ...findReferences(object[key], res)];
      }

      return current;
    },
    []
  );
};

export const getReferenceIdentifierNew = (
  resource: Resource,
  path: string
): string[] => {
  const reference = get(resource, path);
  if (!reference) return [];
  return isArray(reference)
    ? reference.map((ref) => ref.reference || ref.identifier?.value)
    : [reference.reference || reference.identifier?.value];
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

const codingEquals = (
  a: { system?: string; code?: string } = {},
  b: { system?: string; code?: string } = {}
): boolean => {
  const systemSet = has(a, "system") && has(b, "system");
  const codeSet = has(a, "code") && has(b, "code");
  const systemEquals = a.system === b.system;
  const codeEquals = a.code === b.code;

  return (!systemSet || systemEquals) && (!codeSet || codeEquals);
};

const anyCodingEquals = (
  codings: { system?: string; code?: string }[] = [],
  queryValue: { system?: string; code?: string } = {}
) => codings.some((coding) => codingEquals(coding, queryValue));

export const matches = (
  resource: Resource,
  query: ProcessedQuery,
  context?: Resource[]
): boolean => {
  if (
    query.base &&
    resource.resourceType &&
    query.base !== resource.resourceType
  ) {
    return false;
  }

  const splitPath = query.basepath.split(".");
  for (let i = 1; i < splitPath.length; i++) {
    const pathResource = get(resource, splitPath.slice(0, i).join("."));
    if (!pathResource) return false;
    if (isArray(pathResource))
      return pathResource.some((res) =>
        matches(
          res,
          {
            ...query,
            basepath: splitPath.slice(i).join("."),
            base: null,
          },
          context
        )
      );
  }

  // Query contains a reference
  if (query.target) {
    const referenceIdentifier = getReferenceIdentifierNew(
      resource,
      query.basepath
    );

    return referenceIdentifier.some((refId) => {
      if (!refId) return false;
      const reference = getReference(refId, context);
      if (!reference) return false;

      return matches(reference, {
        ...query,
        base: query.target,
        basepath: query.targetpath,
        target: null,
        targetpath: null,
      });
    });
  }

  const resourceValue = get(resource, query.basepath);
  // No value found for the given path
  switch (typeof resourceValue) {
    case "string":
    case "number":
    case "boolean":
      switch (query.operator) {
        case "eq":
          return resourceValue === query.value;
        default:
          throw new Error(`Operator ${query.operator} is not implemented yet.`);
      }
    case "object":
      // TODO: For now we assume that it is an array of codings
      if (isArray(resourceValue))
        return resourceValue.some((rv) =>
          anyCodingEquals(rv.coding, query.value)
        );
      if (has(resourceValue, "coding"))
        return anyCodingEquals(resourceValue.coding, query.value);
    default:
      throw new Error(
        `The resourcetype at path ${query.base}.${query.basepath} is not supported yet.`
      );
  }
};

export const validate = (
  resource: Resource,
  query: Query,
  context?: Resource[]
): boolean => {
  return matches(resource, processQuery(query), context);
};
