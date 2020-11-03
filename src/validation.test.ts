import { matches } from "./validation";

describe("matches", () => {
  const resource = {
    id: "id1",
    resourceType: "testResource",
    string: "test1",
    bool: true,
    reference: { identifier: { value: "id2" } },
  };
  const context = [
    {
      id: "id2",
      resourceType: "testResource",
      reference: { identifier: { value: "id3" } },
      string: "test2",
    },
    {
      id: "id3",
      resourceType: "testResource",
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
          path: "reference.string",
          operator: "eq",
          value: "test2",
        },
        context
      )
    ).toBeTruthy();
  });

  it("multi id references", () => {
    expect(
      matches(
        resource,
        {
          path: "reference.reference.reference.string",
          operator: "eq",
          value: "test1",
        },
        context
      )
    ).toBeTruthy();
  });
});
