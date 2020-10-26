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

const USERID = "Glumli";
const PASSWORD = "password12345";

export interface User {
  commonKey: string | CryptoKey;
  privateKey: string | CryptoKey;
  publicKey: string | CryptoKey;
}

const setupUser = async (
  userId: string = USERID,
  password: string = PASSWORD
) => {
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

const getUser = async (
  userId: string = USERID,
  password: string = PASSWORD
): Promise<User> => {
  const passwordKey = await deriveKey(password);
  const encrypedUser = await database.fetchUser(userId);
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

const createResource = async (userId: string, resource: Object) => {
  const dataKey = await generateSymKey();
  const encryptedResource = await symEncryptString(
    dataKey,
    JSON.stringify(resource)
  );
  const { commonKey } = await getUser(userId);
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

const fetchResource = async (
  userId: string,
  resourceId: string
): Promise<Object> => {
  const { commonKey } = await getUser(userId);
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

const fetchResourceIds = async (userId: string): Promise<string[]> => {
  return await database.fetchResourceIds(userId);
};

const resetDataBase = () => database.reset();

export {
  createResource,
  fetchResource,
  fetchResourceIds,
  setupUser,
  getUser,
  resetDataBase,
};
