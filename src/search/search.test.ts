import { createResource, resetDataBase, setupUser } from "../sdk";
import searchAlgorithms from "./search";
import testResources from "../testResources";

const USERID = "Glumli";
const PASSWORD = "password123";

const resources = [
  {
    id: "id1",
    resourceType: "documentReference",
    ref: {
      identifier: "id2",
    },
  },
  {
    id: "id2",
    resourceType: "Observation",
    ref: {
      identifier: "id3",
    },
  },
  {
    id: "id3",
    resourceType: "documentReference",
    ref: {
      identifier: "id2",
    },
  },
  {
    id: "id4",
    resourceType: "documentReference",
    ref: {
      identifier: "id1",
    },
  },
];

const querys = [
  {
    query: {
      resourceType: "DocumentReference",
      path: "subject.gender",
      operator: "eq",
      value: "female",
    },
    result: { length: 4 },
  },
  {
    query: {
      resourceType: "Encounter",
      path: "subject.gender",
      operator: "eq",
      value: "female",
    },
    result: { length: 8 },
  },
  {
    query: {
      path: "subject.gender",
      operator: "eq",
      value: "female",
    },
    result: { length: 12 },
  },
];

describe("search", () => {
  beforeAll(async () => {
    await resetDataBase();
    await setupUser(USERID, PASSWORD);
    await Promise.all(
      Object.values(testResources).map((resource) =>
        createResource(USERID, PASSWORD, resource)
      )
    );
  });

  Object.keys(searchAlgorithms).forEach((algorithmName) => {
    describe(algorithmName, () => {
      querys.forEach((query) => {
        it(`${query.query.resourceType}/${query.query.path} ${query.query.operator} ${query.query.value}`, async (done) => {
          const result = await searchAlgorithms[algorithmName].search(
            USERID,
            PASSWORD,
            query.query
          );
          expect(result.length).toEqual(query.result.length);
          done();
        });
      });
    });
  });
});
