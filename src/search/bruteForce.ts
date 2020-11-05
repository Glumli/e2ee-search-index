import { matches, Query } from "../validation";
import { fetchResource, fetchResourceIds, Resource } from "../sdk";
import { SearchAlgorithm } from "./search";

const search = async (
  userId: string,
  password: string,
  query: Query
): Promise<Resource[]> => {
  const resourceIds = await fetchResourceIds(userId);
  const resources = await Promise.all(
    resourceIds.map((resourceId) => fetchResource(userId, password, resourceId))
  );
  return resources.filter((resource) => matches(resource, query, resources));
};

export default { search, preprocessing: () => ({}) } as SearchAlgorithm;
