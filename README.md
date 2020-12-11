# E2EE FHIR Search Benchmarking Framework

This repository aims to benchmark different strategies to search on end-to-end encrypted FHIR Resources.

## FrameWork

The basic idea is that every search strategy consist of two parts: preprocessessing and search.
The preprocessing is used to create the search index.
The search will take different search querys and process those.

The framework iterates over the different algorithms and querys and measure different parameters (e.g. #Resources downloaded).

## Setup

### Testresources

The testresources are generated using [synthea](https://github.com/synthetichealth/synthea).
To generate the resources run:

```
git clone https://github.com/synthetichealth/synthea.git
cd synthea
./gradlewbuild check test
./run_synthea -s 1337 -cs 1337
```

The data can now be found in the output folder. Copy those over to `./src/resources/syntha/bundles/` and run `node ./scripts/synthea-generate-resources-file.js`.

In addition you need to fetch the json file that defines the mapping form search parameters to pathes. This can be downloaded from the [HL7 page](ttps://www.hl7.org/fhir/r4/search-parameters.json). Copy it into the `./assets/` directory and run `node ./scripts/generate-parameter-mapping.js`.

Now you are good to go and execute the tests running `npm run test`.
In case you don't have npm/node setup yet you can get it [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

## Resource Flows

This chapter describes the basic crypto flows implemented in the framework. The flows are more complicated than needed for a single user usecase but implemented that way to mirror current EHR implementations.
The end-to-end encryption the following keys:

- passwordKey: Symmetric key that is derived from the user's password.
- user(Public/Private)Key: Asymmetric user specific keypair.
- commonKey: Symmetric user specific key.
- dataKey: Symmetric resource specific key.

### Create User

![FlowChart](./diagrams/createUser.png)

### Get User

![FlowChart](./diagrams/getUser.png)

### Create Resource

![FlowChart](./diagrams/createResource.png)

### Get Resource

![FlowChart](./diagrams/getResource.png)

### Get Resource Ids

![FlowChart](./diagrams/getResourceIds.png)
