import {
  findReferences,
  matches,
  getReferenceIdentifierNew,
} from "./validation";

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
          target: "TestResource",
          targetpath: "string",
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
    const references = findReferences(resource);
    expect(references).toEqual(["reference"]);
  });
});

describe("getReferenceIdentifier", () => {
  it("returns identifier for a given resource and path", () => {
    const paths = ["reference"];
    const referenceIdentifier = paths.map((path) =>
      getReferenceIdentifierNew(resource, path)
    );

    expect(referenceIdentifier).toEqual(["id2"]);
  });
});
