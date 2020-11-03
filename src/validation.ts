import get from "lodash.get";
import isUndefined from "lodash.isundefined";
import { Resource } from "./sdk";

export interface Query {
  resourceType?: string;
  path: string;
  operator: string;
  value: any;
}

const isReference = (value: any) => {
  if (typeof value !== "object") return false;
  if (!value?.identifier?.value && !value?.reference) return false;

  return true;
};

const getReferenceIdentifier = (resource: object, path: string) => {
  const splitPath = path.split(".");
  for (let i = 1; i < splitPath.length; i++) {
    let pathValue = get(resource, splitPath.slice(0, i).join("."));

    // When any value before inding a reference is undefined we know that the rsource won't match
    if (isUndefined(pathValue)) return [false, ""];

    if (isReference(pathValue)) {
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
  if (query.resourceType && query.resourceType !== resource.resourceType)
    return false;

  const resourceValue = get(resource, query.path);
  if (isUndefined(resourceValue)) {
    const [referenceIdentifier, path] = getReferenceIdentifier(
      resource,
      query.path
    );
    if (!referenceIdentifier) return false;

    const reference = getReference(referenceIdentifier, context);

    if (isUndefined(reference)) return false;

    return matches(reference, { ...query, path, resourceType: null }, [
      ...context,
      resource,
    ]);
  }

  switch (query.operator) {
    case "eq":
      return resourceValue === query.value;
      break;
    default:
      throw new Error(`Operator ${query.operator} is not implemented yet.`);
  }
};
