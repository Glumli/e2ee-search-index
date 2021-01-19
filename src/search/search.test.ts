import {
  createResource,
  fetchResource,
  resetDataBase,
  setupUser,
} from "../sdk";
import searchAlgorithms from "./search";
import testconfig from "../resources/testcases/testconfig";
import * as SDK from "../sdk";

const USERID = "Glumli";
const PASSWORD = "password123";
const MINKEY = "minimum";
const indices: { [key: string]: any } = {};

describe("search", () => {
  let fetchResourceSpy: jasmine.Spy;
  let output: {
    [algorithmName: string]: {
      [testcaseName: string]: {
        indexCreation: number;
        testcases: {
          fetches: number;
          time: number;
          query: string;
        }[];
      };
    };
  } = {
    [MINKEY]: {},
  };

  testconfig.testcases.forEach((testcase) => {
    for (const [key, { length }] of Object.entries(testcase.result)) {
      if (!output[MINKEY][key]) {
        output[MINKEY][key] = { testcases: [], indexCreation: 0 };
      }
      output[MINKEY][key].testcases.push({
        query: testcase.query.id,
        fetches: length,
        time: 0,
      });
    }
  });

  beforeAll(async () => {
    fetchResourceSpy = spyOn(SDK, "fetchResource").and.callThrough();
  });

  afterAll(() => {
    console.log(JSON.stringify(output));
  });

  beforeEach(() => {});

  afterEach(() => {
    fetchResourceSpy.calls.reset();
  });

  // Iterate over different datasets
  Object.keys(testconfig.resources).forEach((configName) => {
    // if (configName !== "5") return;
    describe(configName, () => {
      const resources = testconfig.resources[configName];
      const testcases = testconfig.testcases;

      beforeAll((done) => {
        await resetDataBase();
        await setupUser(USERID, PASSWORD);
        const uploadedResouces = await Promise.all(
          Object.values(resources).map(async (resource: SDK.Resource) => {
            // Set the identifier, as we are overwriting the id field
            const identifier = resource.identifier ? resource.identifier : [];
            const identifierResource = {
              ...resource,
              identifier: [...identifier, { value: resource.id }],
            };
            return createResource(USERID, PASSWORD, identifierResource);
          })
        );

        Object.keys(searchAlgorithms).forEach((algorithmName) => {
          if (!output[algorithmName]) {
            output[algorithmName] = {};
          }
          output[algorithmName][configName] = {
            indexCreation: 0,
            testcases: [],
          };

          const t0 = performance.now();
          const preprocessing = searchAlgorithms[algorithmName].preprocessing;
          indices[algorithmName] = preprocessing(uploadedResouces);
          const t1 = performance.now();
          output[algorithmName][configName].indexCreation = t1 - t0;
        });
        done();
      });

      Object.keys(searchAlgorithms).forEach((algorithmName) => {
        // if (algorithmName !== "refIndex") return;
        describe(algorithmName, () => {
          beforeAll(() => {});

          testcases.forEach(({ query, result }) => {
            // if (["val4"].indexOf(query.id) === -1) return;
            fit(`${configName}/${algorithmName}/${query.id}`, async (done) => {
              const t0 = performance.now();
              const searchResult = await searchAlgorithms[
                algorithmName
              ].search(
                USERID,
                query,
                indices[algorithmName],
                (userId, resourceId) =>
                  fetchResource(userId, PASSWORD, resourceId)
              );
              const t1 = performance.now();
              expect(searchResult.length).toEqual(result[configName].length);

              // logging
              output[algorithmName][configName].testcases.push({
                query: query.id,
                fetches: fetchResourceSpy.calls.count(),
                time: t1 - t0,
              });
              done();
            });
          });
        });
      });
    });
  });
});
