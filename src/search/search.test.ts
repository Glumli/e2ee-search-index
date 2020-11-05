import { readdirSync, statSync, writeFileSync } from "fs";
import { resolve } from "path";

import { createResource, resetDataBase, setupUser } from "../sdk";
import searchAlgorithms from "./search";
import testResources from "../testResources";

const USERID = "Glumli";
const PASSWORD = "password123";

const testCases = [
  {
    query: {
      base: "DocumentReference",
      path: "subject:Patient.gender",
      operator: "eq",
      value: "female",
    },
    result: { length: 4 },
  },
  {
    query: {
      base: "Encounter",
      path: "subject:Patient.gender",
      operator: "eq",
      value: "female",
    },
    result: { length: 8 },
  },
  {
    query: {
      path: "subject:Patient.gender",
      operator: "eq",
      value: "female",
    },
    result: { length: 12 },
  },
];

const indices: { [key: string]: any } = {};

describe("search", () => {
  let fetchResourceSpy;
  beforeAll(async () => {
    await resetDataBase();
    await setupUser(USERID, PASSWORD);

    const uploadedResouces = await Promise.all(
      Object.values(testResources).map((resource) =>
        createResource(USERID, PASSWORD, resource)
      )
    );
    Object.keys(searchAlgorithms).forEach((algorithmName) => {
      const preprocessing = searchAlgorithms[algorithmName].preprocessing;
      indices[algorithmName] = preprocessing(uploadedResouces);
    });
  });
  beforeEach(() => {});

  afterEach(() => {});

  Object.keys(searchAlgorithms).forEach((algorithmName) => {
    describe(algorithmName, () => {
      testCases.forEach(({ query, result }) => {
        it(`${query.base}/${query.path} ${query.operator} ${query.value}`, async (done) => {
          const searchResult = await searchAlgorithms[algorithmName].search(
            USERID,
            PASSWORD,
            query,
            indices[algorithmName]
          );
          expect(searchResult.length).toEqual(result.length);
          done();
        });
      });
    });
  });
});
