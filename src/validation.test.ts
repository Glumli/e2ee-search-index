import { findReferences, matches, getReferenceIdentifier } from "./validation";

const resource = {
  id: "id1",
  resourceType: "TestResource",
  identifier: [{ value: "id1" }],
  string: "test1",
  bool: true,
  reference: { identifier: { value: "id2" } },
};
const context = [
  {
    id: "id2",
    resourceType: "OtherResourceType",
    reference: { identifier: { value: "id3" } },
    string: "test2",
  },
  {
    id: "id3",
    resourceType: "YetAnotherResourceType",
    reference: { identifier: { value: "id1" } },
    string: "test3",
  },
];

describe("matches", () => {
  it("string", () => {
    expect(
      matches(resource, {
        base: "TestResource",
        basepath: "string",
        operator: "eq",
        value: "test1",
      })
    ).toBeTruthy();
    expect(
      matches(resource, {
        base: "TestResource",
        basepath: "string",
        operator: "eq",
        value: true,
      })
    ).toBeFalsy();
  });

  it("bool", () => {
    expect(
      matches(resource, {
        base: "TestResource",
        basepath: "bool",
        operator: "eq",
        value: true,
      })
    ).toBeTruthy();
    expect(
      matches(resource, {
        base: "TestResource",
        basepath: "bool",
        operator: "eq",
        value: false,
      })
    ).toBeFalsy();
    expect(
      matches(resource, {
        base: "TestResource",
        basepath: "bool",
        operator: "eq",
        value: "true",
      })
    ).toBeFalsy();
  });

  it("id reference", () => {
    expect(
      matches(
        resource,
        {
          base: "TestResource",
          basepath: "reference",
          target: "OtherResourceType",
          targetpath: "string",
          operator: "eq",
          value: "test2",
        },
        context
      )
    ).toBeTruthy();
  });

  it("reverse chaining", () => {
    expect(
      matches(
        resource,
        {
          modifier: "_has",
          base: "YetAnotherResourceType",
          basepath: "string",
          basereferencepath: "reference",
          target: "TestResource",
          operator: "eq",
          value: "test3",
        },
        context
      )
    ).toBeTruthy();
  });
});

describe("findReferences", () => {
  it("returns pathes to references", () => {
    const references = findReferences(resource);
    expect(references).toEqual([{ FHIRPath: "reference", path: "reference" }]);
  });
});

describe("getReferenceIdentifier", () => {
  it("returns identifier for a given resource and path", () => {
    const paths = ["reference"];
    const referenceIdentifier = paths.map((path) =>
      getReferenceIdentifier(resource, path)
    );

    expect(referenceIdentifier).toEqual([["id2"]]);
  });
});
