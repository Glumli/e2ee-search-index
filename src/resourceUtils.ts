export const QUERY_ERROR =
  "The query is expected in the following format: [path]:[target].[path]";

export const splitQuery = (queryPath: string) => {
  let basePath, target, targetPath;

  const splitPath = queryPath.split(":");
  basePath = splitPath[0];
  // Query contains a reference
  if (splitPath.length > 1) {
    // More than two ":"
    if (splitPath.length > 2) throw new Error(QUERY_ERROR);

    let path;
    [target, ...path] = splitPath[1].split(".");
    // No query after the target resourceType
    if (!path) throw new Error(QUERY_ERROR);

    targetPath = path.join(".");
  }
  return { basePath, target, targetPath };
};
