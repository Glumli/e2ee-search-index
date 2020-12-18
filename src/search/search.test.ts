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
      Object.values(testResources).map((resource: SDK.Resource) => {
        // Set the identifier, as we are overwriting the id field
        const identifier = resource.identifier ? resource.identifier : [];
        const identifierResource = {
          ...resource,
          identifier: [...identifier, { value: resource.id }],
        };
        return createResource(USERID, PASSWORD, identifierResource);
      })
    );
    output = "Create Indices:\n";
    Object.keys(searchAlgorithms).forEach((algorithmName) => {
      const t0 = performance.now();
      const preprocessing = searchAlgorithms[algorithmName].preprocessing;
      indices[algorithmName] = preprocessing(uploadedResouces);
      const t1 = performance.now();
      output += `  ${algorithmName}: ${(t1 - t0).toFixed(0)} milliseconds`;
    });

    fetchResourceSpy = spyOn(SDK, "fetchResource").and.callThrough();
    output += "Search\n";
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
        // if (query.modifier) {
        it(`${query.base}/${query.baseparameter} ${query.operator} ${query.value}`, async (done) => {
          const t0 = performance.now();
          const searchResult = await searchAlgorithms[algorithmName].search(
            USERID,
            PASSWORD,
            query,
            indices[algorithmName]
          );
          const t1 = performance.now();
          expect(searchResult.length).toEqual(result.length);
          output = `${output}    ${query.base}/${query.baseparameter} ${
            query.operator
          } ${query.value}: ${fetchResourceSpy.calls.count()} fetches for ${
            result.length
          } resources in ${(t1 - t0).toFixed(0)} ms\n`;
          done();
        });
        // }
      });
    });
  });
});
