import {
  deriveKey,
  generateAsymKeyPair,
  generateSymKey,
  exportSymKeyToBase64,
  exportPrivateKeyToPKCS8,
  exportPublicKeyToSPKI,
  symEncryptString,
  asymEncryptString,
  symDecryptString,
  asymDecryptString,
  importPrivateKeyFromPKCS8,
  importSymKeyFromBase64,
  importPublicKeyFromSPKI,
} from "./crypto";
import database, { uuidv4 } from "./backend";

interface FakeDB {
  users: { [id: string]: User };
  records: { [id: string]: { resource: string; key: string } };
  fetchUser: (userId: string) => Promise<User>;
  createUser: (userId: string, user: User) => Promise<boolean>;
  createResource: (
    userId: string,
    data: { resource: string; key: string }
  ) => Promise<string>;
  fetchResource: (
    userId: string,
    resourceId: string
  ) => Promise<{ resource: string; key: string }>;
  fetchResourceIds: (userId: string) => Promise<string[]>;
  reset: () => Promise<boolean>;
}

const fakeDatabase: FakeDB = {
  users: {},
  records: {},
  fetchUser: (userId: string) => {
    return Promise.resolve(fakeDatabase.users[userId]);
  },
  createUser: (userId: string, user: User) => {
    fakeDatabase.users[userId] = user;
    return Promise.resolve(true);
  },
  createResource: (userId: string, data: { resource: string; key: string }) => {
    const resourceId = uuidv4();
    fakeDatabase.records[resourceId] = data;
    return Promise.resolve(resourceId);
  },
  fetchResource: (userId: string, resourceId: string) => {
    return Promise.resolve(fakeDatabase.records[resourceId]);
  },
  fetchResourceIds: (userId: string) => {
    return Promise.resolve(Object.keys(fakeDatabase.records));
  },
  reset: () => {
    fakeDatabase.users = {};
    fakeDatabase.records = {};
    return Promise.resolve(true);
  },
};

export interface User {
  commonKey: string | CryptoKey;
  privateKey: string | CryptoKey;
  publicKey: string | CryptoKey;
}

interface Identifier {
  value: string;
}
export interface Resource {
  id?: string;
  resourceType: string;
  identifier?: Identifier[];
  [key: string]: any;
}

export const getUser = async (
  userId: string,
  password: string
): Promise<User | false> => {
  const encrypedUser = await fakeDatabase.fetchUser(userId);
  if (!encrypedUser) return false;

  const passwordKey = await deriveKey(password);

  const publicKey = await importPublicKeyFromSPKI(
    encrypedUser.publicKey as string
  );

  const privateKey = await symDecryptString(
    passwordKey,
    encrypedUser.privateKey as string
  ).then(importPrivateKeyFromPKCS8);

  const commonKey = await asymDecryptString(
    privateKey,
    encrypedUser.commonKey as string
  ).then(importSymKeyFromBase64);

  return { commonKey, privateKey, publicKey };
};

export const setupUser = async (
  userId: string,
  password: string
): Promise<User> => {
  const user = await getUser(userId, password);
  if (user) return user;

  // const passwordKey = await deriveKey(password);
  // const commonKey = await generateSymKey();
  // const exportedCommonKey = await exportSymKeyToBase64(commonKey);
  // const { privateKey, publicKey } = await generateAsymKeyPair();
  // const exportedKeyPair = {
  //   privateKey: await exportPrivateKeyToPKCS8(privateKey),
  //   publicKey: await exportPublicKeyToSPKI(publicKey),
  // };
  // await fakeDatabase.createUser(userId, {
  //   commonKey: await asymEncryptString(publicKey, exportedCommonKey),
  //   privateKey: await symEncryptString(passwordKey, exportedKeyPair.privateKey),
  //   publicKey: exportedKeyPair.publicKey,
  // });
  return { commonKey: "", privateKey: "", publicKey: "" };
};

export const createResource = async (
  userId: string,
  password: string,
  resource: Resource
): Promise<Resource> => {
  const user = await getUser(userId, password);
  // if (!user) throw new Error(`User ${userId} does not exist.`);
  // const { commonKey } = user;

  // const dataKey = await generateSymKey();
  // const encryptedResource = await symEncryptString(
  //   dataKey,
  //   JSON.stringify(resource)
  // );
  // const encryptedDataKey = await symEncryptString(
  //   commonKey as CryptoKey,
  //   await exportSymKeyToBase64(dataKey)
  // );
  const encryptedResource = JSON.stringify(resource);
  const encryptedDataKey = "";
  return fakeDatabase
    .createResource(userId, {
      resource: encryptedResource,
      key: encryptedDataKey,
    })
    .then((resourceId) => ({ ...resource, id: resourceId }));
};

export const fetchResource = async (
  userId: string,
  password: string,
  resourceId: string
): Promise<Resource> => {
  const user = await getUser(userId, password);
  // if (!user) throw new Error(`User ${userId} does not exist.`);
  // const { commonKey } = user;

  const response = await fakeDatabase.fetchResource(userId, resourceId);

  // if (!response) return Promise.resolve({ id: "", resourceType: "" });

  // const { resource: encryptedResource, key } = response;
  // const dataKey = await symDecryptString(commonKey as CryptoKey, key).then(
  //   importSymKeyFromBase64
  // );
  // const resource = await symDecryptString(dataKey, encryptedResource).then(
  //   JSON.parse
  // );
  const resource = response ? JSON.parse(response.resource) : {};
  return { ...resource, id: resourceId };
};

export const fetchResourceIds = async (userId: string): Promise<string[]> => {
  return await fakeDatabase.fetchResourceIds(userId);
};

export const resetDataBase = () => fakeDatabase.reset();
