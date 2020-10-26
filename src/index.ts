import {
  createResource,
  fetchResource,
  fetchResourceIds,
  setupUser,
  getUser,
  resetDataBase,
} from "./sdk";

// Add methods to window so that methods can be tested.
declare global {
  interface Window {
    HPI: any;
  }
}

window.HPI = window.HPI || {
  setupUser,
  getUser,
  createResource,
  fetchResource,
  fetchResourceIds,
  resetDataBase,
};
