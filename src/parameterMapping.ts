import map from "./parameterMapping.json";
import { Query, ProcessedQuery } from "./validation";
import isUndefined from "lodash.isundefined";

interface Mapping {
  [base: string]: { [path: string]: any };
}
const mapping = map as Mapping;

const getPath = (resourcetype: string, parameter: string) => {
  if (!mapping[resourcetype])
    throw new Error(`${resourcetype} is not a supported FHIR resource.`);

  let path = mapping[resourcetype][parameter];
  if (!path) path = mapping["Resource"][parameter];
  if (!path)
    throw new Error(
      `${parameter} is not a supported search parameter for the ResourceType ${resourcetype}`
    );
  return path;
};

const isComplexPath = (path: string): boolean => {
  return path.indexOf(".where(") !== -1;
};

const isSpecifiedReference = (path: string): boolean => {
  return path.indexOf(".where(resolve() is ") !== -1;
};

const processSpecifiedReferencePath = (
  path: string
): { specifiedTarget: string; path: string } => {
  return {
    specifiedTarget: path.split(" ").slice(-1)[0].slice(0, -1),
    path: path.split(".where(")[0],
  };
};

const handleComplexPaths = (query: ProcessedQuery) => {
  const processedQuery = { ...query };
  if (!query.basepath) return processedQuery;

  if (isComplexPath(query.basepath)) {
    if (isSpecifiedReference(query.basepath)) {
      const { specifiedTarget, path } = processSpecifiedReferencePath(
        query.basepath
      );
      if (specifiedTarget !== query.target) {
        throw new Error(
          `The given baseparameter requires the target to be ${specifiedTarget} but given was ${query.target}`
        );
      }
      processedQuery.basepath = path;
    } else {
      throw new Error(`${query.basepath} is not supported yet.`);
    }
  }
  return processedQuery;
};

const processQuery = (query: Query): ProcessedQuery => {
  const processedQuery: any = {};
  if (query.base) processedQuery.base = query.base;
  if (query.operator) processedQuery.operator = query.operator;
  if (!isUndefined(query.value)) processedQuery.value = query.value;
  if (query.modifier) processedQuery.modifier = query.modifier;

  if (query.baseparameter)
    processedQuery.basepath = getPath(query.base, query.baseparameter);

  if (query.target) {
    processedQuery.target = query.target;
    if (query.targetparameter) {
      processedQuery.targetpath = getPath(query.target, query.targetparameter);
    }
  }
  if (query.basereferenceparameter) {
    processedQuery.basereferencepath = getPath(
      query.base,
      query.basereferenceparameter
    );
  }
  return handleComplexPaths(processedQuery);
};

export { processQuery };
