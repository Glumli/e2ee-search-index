# E2EE FHIR Search Benchmarking Framework
This repository aims to benchmark different strategies to search on end-to-end encrypted FHIR Resources.

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

## FrameWork
The Framework still needs to be implemented. The basic idea is that every search strategy consist of two parts: preprocessessing and search.
The preprocessing can for example be used to create the search index. 
The search will take different search querys and process those.

The framework will iterate over the different algorithms and querys and measure different parameters (e.g. #Resources downloaded). 