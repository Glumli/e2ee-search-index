import { matches, Query, validate } from "../validation";
import { fetchResource, fetchResourceIds, Resource } from "../sdk";
import { SearchAlgorithm } from "./search";

const search = async (
  userId: string,
  query: Query,
  index: {},
  fetchResource: (userId: string, resourceId: string) => Promise<Resource>
): Promise<Resource[]> => {
  const resourceIds = await fetchResourceIds(userId);
  const resources = await Promise.all(
    resourceIds.map((resourceId) => fetchResource(userId, resourceId))
  );
  return resources.filter((resource) => validate(resource, query, resources));
};

export default { search, preprocessing: () => ({}) } as SearchAlgorithm;
