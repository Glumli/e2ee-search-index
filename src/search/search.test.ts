import {
  createResource,
  fetchResource,
  resetDataBase,
  setupUser,
} from "../sdk";
// import sizeof from "object-sizeof";
import searchAlgorithms from "./search";
import testconfig from "../resources/testcases/testconfig";
import * as SDK from "../sdk";

const stringbytesize = (str: string) => new Blob([str]).size;
const objectbytesize = (obj: object) => stringbytesize(JSON.stringify(obj));

const USERID = "Glumli";
const PASSWORD = "password123";
const MINKEY = "optimum";
const indices: { [key: string]: any } = {};

let networkCounter = 0;
export const networkCall = () => {
  networkCounter = networkCounter + 1;
};

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
          indexSize?: number;
          dataSize?: number;
          networkCalls: number;
        }[];
      };
    };
  } = {
    [MINKEY]: {},
  };

  const writeOptimum = (
    configName: string,
    queryId: string,
    result: object[]
  ) => {
    if (!output[MINKEY]) {
      output[MINKEY] = {};
    }
    if (!output[MINKEY][configName]) {
      output[MINKEY][configName] = {
        indexCreation: 0,
        testcases: [],
      };
    }
    output[MINKEY][configName].testcases.push({
      query: queryId,
      fetches: result.length,
      time: 0,
      indexSize: 0,
      dataSize: objectbytesize(result),
      networkCalls: 1,
    });
  };

  beforeAll(async () => {
    fetchResourceSpy = spyOn(SDK, "fetchResource").and.callThrough();
  });

  afterAll(() => {
    console.log(
      JSON.stringify({
        filter_key: "log-filter",
        message: JSON.stringify(output),
      })
    );
  });

  beforeEach(() => {});

  afterEach(() => {
    fetchResourceSpy.calls.reset();
    networkCounter = 0;
  });

  const IS_EVALUATION = false;
  const ALL_ALGORITHMS = Object.keys(searchAlgorithms);
  const ALL_CONFIGS = Object.keys(testconfig.resources);
  const QUICK_CONFIGS = ["1", "5", "15", "25", "35", "45", "55", "65", "75"];
  const QUICK_QUICK_CONFIGS = ["1", "25", "75"];
  const ITERATIONS = IS_EVALUATION ? 3 : 3;
  const CONFIGS = IS_EVALUATION ? ALL_CONFIGS : QUICK_QUICK_CONFIGS;
  const ALGORITHMS = IS_EVALUATION ? ALL_ALGORITHMS : ALL_ALGORITHMS; //["referenceIndex"];
  // Iterate multiple times
  for (let iteration = 0; iteration < ITERATIONS; iteration++) {
    // Iterate over different datasets
    Object.keys(testconfig.resources).forEach((configName) => {
      if (CONFIGS.indexOf(configName) === -1) return;
      describe(`Iteration ${iteration}: Dataset ${configName}`, () => {
        const resources = testconfig.resources[configName];
        const testcases = testconfig.testcases;

        beforeAll(async () => {
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

          ALGORITHMS.forEach((algorithmName) => {
            if (!output[algorithmName]) {
              output[algorithmName] = {};
            }
            output[algorithmName][configName] = {
              indexCreation: 0,
              testcases: [],
            };
            const preprocessing = searchAlgorithms[algorithmName].preprocessing;
            const t0 = performance.now();
            indices[algorithmName] = preprocessing(uploadedResouces);
            const t1 = performance.now();
            output[algorithmName][configName].indexCreation = t1 - t0;
          });
        });

        Object.keys(searchAlgorithms).forEach(
          (algorithmName, algorithmNumber) => {
            if (ALGORITHMS.indexOf(algorithmName) === -1) return;
            describe(algorithmName, () => {
              beforeAll(() => {});

              testcases.forEach(({ query, result }) => {
                //if (query.id === "ref3") {
                fit(`${iteration}/${configName}/${algorithmName}/${query.id}`, async (done) => {
                  const t0 = performance.now();
                  const searchResult = await searchAlgorithms[
                    algorithmName
                  ].search(
                    USERID,
                    query,
                    indices[algorithmName],
                    (userId, resourceId) =>
                      fetchResource(userId, PASSWORD, resourceId),
                    networkCall
                  );
                  const t1 = performance.now();
                  expect(searchResult.length).toEqual(
                    result[configName].length
                  );

                  // logging
                  const data = await Promise.all(
                    fetchResourceSpy.calls
                      .all()
                      .map(({ returnValue }) => returnValue)
                  );
                  const dataSize = objectbytesize(data);

                  if (algorithmNumber === 0) {
                    writeOptimum(configName, query.id, searchResult);
                  }

                  output[algorithmName][configName].testcases.push({
                    query: query.id,
                    fetches: fetchResourceSpy.calls.count(),
                    time: t1 - t0,
                    indexSize: objectbytesize(indices[algorithmName]),
                    dataSize,
                    networkCalls: networkCounter,
                  });
                  done();
                });
                // }
              });
            });
          }
        );
      });
    });
  }
});
