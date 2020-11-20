import {
  createResource,
  fetchResource,
  resetDataBase,
  setupUser,
} from "../sdk";
import searchAlgorithms from "./search";
import testResources from "../resources/testResources";
import testCases from "./testcases.json";
import * as SDK from "../sdk";

const USERID = "Glumli";
const PASSWORD = "password123";

const indices: { [key: string]: any } = {};

describe("search", () => {
  let fetchResourceSpy: jasmine.Spy;
  let output: string;
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

    fetchResourceSpy = spyOn(SDK, "fetchResource").and.callThrough();
    output = "Search\n";
  });

  afterAll(() => {
    console.log(output);
  });

  beforeEach(() => {});

  afterEach(() => {
    fetchResourceSpy.calls.reset();
  });

  Object.keys(searchAlgorithms).forEach((algorithmName) => {
    describe(algorithmName, () => {
      beforeAll(() => {
        output = `${output}  ${algorithmName}\n`;
      });

      testCases.forEach(({ query, result }) => {
        it(`${query.base}/${query.baseparameter} ${query.operator} ${query.value}`, async (done) => {
          const searchResult = await searchAlgorithms[algorithmName].search(
            USERID,
            PASSWORD,
            query,
            indices[algorithmName]
          );
          expect(searchResult.length).toEqual(result.length);
          output = `${output}    ${query.base}/${query.baseparameter} ${
            query.operator
          } ${query.value}: ${fetchResourceSpy.calls.count()}\n`;
          done();
        });
      });
    });
  });
});
