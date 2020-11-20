import { processQuery } from "./parameterMapping";

describe("processQuery", () => {
  it("DocumentReference's identifier is mapped properly", () => {
    const result = processQuery({
      base: "DocumentReference",
      baseparameter: "identifier",
      operator: "eq",
      value: "",
    });
    expect(result).toEqual({
      base: "DocumentReference",
      basepath: "masterIdentifier",
      operator: "eq",
      value: "",
    });
  });

  it("DocumentReference inherits _lastUpdated from Resource", () => {
    const result = processQuery({
      base: "DocumentReference",
      baseparameter: "_lastUpdated",
      operator: "eq",
      value: "",
    });
    expect(result).toEqual({
      base: "DocumentReference",
      basepath: "meta.lastUpdated",
      operator: "eq",
      value: "",
    });
  });

  it("basic base and target are mapped properly", () => {
    const result = processQuery({
      base: "Person",
      baseparameter: "organization",
      target: "Organization",
      targetparameter: "address-country",
      operator: "eq",
      value: "",
    });
    expect(result).toEqual({
      base: "Person",
      basepath: "managingOrganization",
      target: "Organization",
      targetpath: "address.country",
      operator: "eq",
      value: "",
    });
  });

  it("Account's patient updates sets the target properly", () => {
    const result = processQuery({
      base: "Account",
      baseparameter: "patient",
      target: "Patient",
      targetparameter: "address-country",
      operator: "eq",
      value: "",
    });
    expect(result).toEqual({
      base: "Account",
      basepath: "subject",
      target: "Patient",
      targetpath: "address.country",
      operator: "eq",
      value: "",
    });
  });
});
