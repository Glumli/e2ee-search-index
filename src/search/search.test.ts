import {
  createResource,
  fetchResource,
  resetDataBase,
  setupUser,
} from "../sdk";
import searchAlgorithms from "./search";
import testconfig from "../resources/cohorts/testconfig";
import * as SDK from "../sdk";
import { patientResources } from "../resources/testConfigInterface";

const USERID = "Glumli";
const PASSWORD = "password123";

const MINKEY = "optimum";

const stringbytesize = (str: string) => new Blob([str]).size;
const objectbytesize = (obj: object) => stringbytesize(JSON.stringify(obj));

interface Output {
  [cohortName: string]: object;
}

interface CohortOutput {
  [algorithmName: string]: object;
}

interface AlogrithmOutput {
  [patientId: string]: object;
}

interface PatientOutput {
  [caseId: string]: object;
}

// TODO: This can be replaced by implementing a bundles downlad method that can then be spied.
let networkCounter = 0;
export const networkCall = () => {
  networkCounter = networkCounter + 1;
};

describe("Benchmarking Search", () => {
  Object.entries(testconfig.cohorts).forEach(([cohortName, patients]) => {
    let fetchResourceSpy: jasmine.Spy;

    // cohort, algorithm, patient, testcases
    let output: Output = {};

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

    describe(cohortName, () => {
      const cohortOutput: CohortOutput = {};

      Object.entries(searchAlgorithms).forEach(
        ([algorithmName, algorithm], algorithmNumber) => {
          describe(algorithmName, () => {
            const algorithmOutput: AlogrithmOutput = {};
            const algorithmOptimumOutput: AlogrithmOutput = {};

            patients.forEach((patient) => {
              describe(patient, () => {
                const patientOutput: PatientOutput = {};
                const patientOptimumOutput: PatientOutput = {};

                let index = {};

                beforeAll(async () => {
                  const resourceResponse = await fetch(
                    `http://localhost:8080/resources/${cohortName}/${patient}`
                  ).catch((e) =>
                    console.log(
                      `Fetching ${cohortName}/${patient} failed: ${e.message}`
                    )
                  );
                  const res = await (resourceResponse as Response);
                  const resString = res
                    ? await (resourceResponse as Response).json()
                    : "{}";

                  const resources = JSON.parse(resString) as patientResources;
                  await resetDataBase();
                  await setupUser(USERID, PASSWORD);
                  const uploadedResources = await Promise.all(
                    Object.values(resources).map(
                      async (resource: SDK.Resource) => {
                        // Set the identifier, as we are overwriting the id field
                        const identifier = resource.identifier
                          ? resource.identifier
                          : [];
                        const identifierResource = {
                          ...resource,
                          identifier: [...identifier, { value: resource.id }],
                        };
                        return createResource(
                          USERID,
                          PASSWORD,
                          identifierResource
                        );
                      }
                    )
                  );
                  index = algorithm.preprocessing(uploadedResources);
                  return;
                });

                afterEach(() => {
                  fetchResourceSpy.calls.reset();
                  networkCounter = 0;
                });

                testconfig.testcases[cohortName].forEach((testcase) => {
                  fit(testcase.query.id, async () => {
                    const result = await algorithm.search(
                      USERID,
                      testcase.query,
                      index,
                      (userId, resourceId) =>
                        fetchResource(userId, PASSWORD, resourceId),
                      networkCall
                    );

                    let rs = objectbytesize(result);
                    patientOutput[testcase.query.id] = {
                      fetches: fetchResourceSpy.calls.count(),
                      resultSize: rs,
                      networkCalls: networkCounter,
                    };
                    patientOptimumOutput[testcase.query.id] = {
                      fetches: result.length,
                      resultSize: rs,
                      networkCalls: 1,
                    };
                    return;
                  });
                });
                algorithmOutput[patient] = patientOutput;
                algorithmOptimumOutput[patient] = patientOptimumOutput;
              });
            });
            cohortOutput[algorithmName] = algorithmOutput;
            cohortOutput[MINKEY] = algorithmOptimumOutput;
          });
        }
      );
      output[cohortName] = cohortOutput;
    });
  });
});
