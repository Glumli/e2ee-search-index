import {
  findReferences,
  matches,
  getReferenceIdentifierNew,
} from "./validation";

import testResources from "./testResources";

describe("matches", () => {
  const resource = {
    id: "id1",
    resourceType: "TestResource",
    string: "test1",
    bool: true,
    reference: { identifier: { value: "id2" } },
  };
  const context = [
    {
      id: "id2",
      resourceType: "TestResource",
      reference: { identifier: { value: "id3" } },
      string: "test2",
    },
    {
      id: "id3",
      resourceType: "TestResource",
      reference: { identifier: { value: "id1" } },
      string: "test3",
    },
  ];

  it("string", () => {
    expect(
      matches(resource, { path: "string", operator: "eq", value: "test1" })
    ).toBeTruthy();
    expect(
      matches(resource, { path: "string", operator: "eq", value: true })
    ).toBeFalsy();
  });

  it("bool", () => {
    expect(
      matches(resource, { path: "bool", operator: "eq", value: true })
    ).toBeTruthy();
    expect(
      matches(resource, { path: "bool", operator: "eq", value: false })
    ).toBeFalsy();
    expect(
      matches(resource, { path: "bool", operator: "eq", value: "true" })
    ).toBeFalsy();
  });

  it("id reference", () => {
    expect(
      matches(
        resource,
        {
          path: "reference:TestResource.string",
          operator: "eq",
          value: "test2",
        },
        context
      )
    ).toBeTruthy();
  });
});

describe("findReferences", () => {
  it("returns pathes to references", () => {
    const references = findReferences(
      testResources.S4hDocrefWithPngExampleDocumentreference
    );
    expect(references).toEqual(["subject", "author.0", "context.encounter.0"]);

    const referenceIdentifier = references.map((path) =>
      getReferenceIdentifierNew(
        testResources.S4hDocrefWithPngExampleDocumentreference,
        path
      )
    );
  });
});

describe("getReferenceIdentifier", () => {
  it("returns identifier for a given resource and path", () => {
    const paths = ["subject", "author.0", "context.encounter.0"];
    const referenceIdentifier = paths.map((path) =>
      getReferenceIdentifierNew(
        testResources.S4hDocrefWithPngExampleDocumentreference,
        path
      )
    );

    expect(referenceIdentifier).toEqual([
      "CD9B26EA-234E-46BB-91A1-D67B23064396",
      "clinic-xyz",
      "test-initial",
    ]);
  });
});
