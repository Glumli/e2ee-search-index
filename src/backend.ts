import { openDB, IDBPDatabase } from "idb";

import { User } from "./sdk";

const DB_VERSION = 1;
const OBJECTSTORE_NAMES = ["users", "resources"];
const INDEXEDDB_NAME = "backend";

interface DBUser {
  common_key: string;
  public_key: string;
  private_key: string;
}

const uuidv4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

class DataBase {
  db: Promise<IDBPDatabase>;

  constructor() {
    if (!("indexedDB" in window)) {
      throw new Error("This browser does not suppert IndexedDB");
    }

    this.db = openDB(INDEXEDDB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase) {
        OBJECTSTORE_NAMES.forEach((name) => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name);
          }
        });
      },
    });
  }

  async createUser(userId: string, user: User): Promise<boolean> {
    const body = {
      common_key: user.commonKey,
      private_key: user.privateKey,
      public_key: user.publicKey,
    };
    return (await this.db)
      .put("users", body, userId)
      .then(() => true)
      .catch((error: Error) => {
        console.warn(error);
        throw error;
      });
  }

  async fetchUser(userId: string): Promise<User | false> {
    return (await this.db)
      .get("users", userId)
      .then((user: DBUser) => {
        if (!user) return false;
        return {
          commonKey: user.common_key,
          privateKey: user.private_key,
          publicKey: user.public_key,
        };
      })
      .catch((error: Error) => {
        console.warn(error);
        throw error;
      });
  }

  async createResource(
    userId: string,
    data: { resource: string; key: string }
  ) {
    const resourceId = uuidv4();
    const body = { resource: data.resource, data_key: data.key };
    return (await this.db)
      .put("resources", body, resourceId)
      .then(() => body)
      .catch((error: Error) => {
        console.warn(error);
        throw error;
      })
      .then(() => resourceId);
  }

  async fetchResource(
    userId: string,
    resourceId: string
  ): Promise<{ key: string; resource: string }> {
    return (await this.db).get("resources", resourceId).then((response) => ({
      key: response.data_key,
      resource: response.resource,
    }));
  }

  async fetchResourceIds(userId: string): Promise<string[]> {
    return (await this.db)
      .getAllKeys("resources")
      .then((keys) => keys.map((key) => key.toString()))
      .catch((error: Error) => {
        console.warn(error);
        throw error;
      });
  }

  async reset() {
    return Promise.all(
      OBJECTSTORE_NAMES.map(async (store) => await (await this.db).clear(store))
    ).then(() => true);
  }
}

export default new DataBase();
