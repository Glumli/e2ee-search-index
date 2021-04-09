import { Query, validate } from "../validation";
import { fetchResourceIds, Resource } from "../sdk";
import { SearchAlgorithm } from "./search";

const search = async (
  userId: string,
  query: Query,
  index: {},
  fetchResource: (userId: string, resourceId: string) => Promise<Resource>,
  networkCall: () => void
): Promise<Resource[]> => {
  const resourceIds = await fetchResourceIds(userId);
  networkCall();
  const resources = await Promise.all(
    resourceIds.map((resourceId) => fetchResource(userId, resourceId))
  );
  return resources.filter((resource) => validate(resource, query, resources));
};

export default { search, preprocessing: () => ({}) } as SearchAlgorithm;
