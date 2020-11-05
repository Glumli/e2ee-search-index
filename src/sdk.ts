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
import database from "./backend";

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
}

export const getUser = async (
  userId: string,
  password: string
): Promise<User | false> => {
  const encrypedUser = await database.fetchUser(userId);
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

  const passwordKey = await deriveKey(password);
  const commonKey = await generateSymKey();
  const exportedCommonKey = await exportSymKeyToBase64(commonKey);
  const { privateKey, publicKey } = await generateAsymKeyPair();
  const exportedKeyPair = {
    privateKey: await exportPrivateKeyToPKCS8(privateKey),
    publicKey: await exportPublicKeyToSPKI(publicKey),
  };
  await database.createUser(userId, {
    commonKey: await asymEncryptString(publicKey, exportedCommonKey),
    privateKey: await symEncryptString(passwordKey, exportedKeyPair.privateKey),
    publicKey: exportedKeyPair.publicKey,
  });
  return { commonKey, privateKey, publicKey };
};

export const createResource = async (
  userId: string,
  password: string,
  resource: Resource
): Promise<Resource> => {
  const user = await getUser(userId, password);
  if (!user) throw new Error(`User ${userId} does not exist.`);
  const { commonKey } = user;

  const dataKey = await generateSymKey();
  const encryptedResource = await symEncryptString(
    dataKey,
    JSON.stringify(resource)
  );
  const encryptedDataKey = await symEncryptString(
    commonKey as CryptoKey,
    await exportSymKeyToBase64(dataKey)
  );
  return await database
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
  if (!user) throw new Error(`User ${userId} does not exist.`);
  const { commonKey } = user;

  const { resource: encryptedResource, key } = await database.fetchResource(
    userId,
    resourceId
  );
  const dataKey = await symDecryptString(commonKey as CryptoKey, key).then(
    importSymKeyFromBase64
  );
  const resource = await symDecryptString(dataKey, encryptedResource).then(
    JSON.parse
  );
  return { ...resource, id: resourceId };
};

export const fetchResourceIds = async (userId: string): Promise<string[]> => {
  return await database.fetchResourceIds(userId);
};

export const resetDataBase = () => database.reset();
