// UTILS
import { fromByteArray, toByteArray } from "base64-js";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const convertArrayBufferToBase64 = (data: ArrayBuffer): string =>
  fromByteArray(new Uint8Array(data));
const convertBase64ToArrayBuffer = (base64: string): ArrayBuffer =>
  new Uint8Array(toByteArray(base64)).buffer;

const convertStringToArrayBuffer = textEncoder.encode.bind(textEncoder);
const convertArrayBufferToString = textDecoder.decode.bind(textDecoder);

const mergeArrayBuffer = (
  buffer1: ArrayBuffer,
  buffer2: ArrayBuffer
): ArrayBuffer => {
  const tmpUint8 = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmpUint8.set(new Uint8Array(buffer1), 0);
  tmpUint8.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmpUint8.buffer;
};

// KEYS
const ENCRYPT = "encrypt";
const DECRYPT = "decrypt";

const AES_GCM = {
  name: "AES-GCM",
  length: 256,
};

const RSA_OAEP = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  // 0x010001 = 65537 is a Fermat Prime and a popular choice for the public exponent.
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: { name: "SHA-256" },
};

const generateSymKey = (): Promise<CryptoKey> =>
  crypto.subtle.generateKey(AES_GCM, true, [ENCRYPT, DECRYPT]) as Promise<
    CryptoKey
  >;

const generateAsymKeyPair = (): Promise<CryptoKeyPair> =>
  crypto.subtle.generateKey(RSA_OAEP, true, [ENCRYPT, DECRYPT]) as Promise<
    CryptoKeyPair
  >;

const exportPublicKeyToSPKI = (key: CryptoKey) =>
  crypto.subtle
    .exportKey("spki", key)
    .then((SPKI) => new Uint8Array(SPKI))
    .then(convertArrayBufferToBase64);

const importPublicKeyFromSPKI = (SPKI: string): Promise<CryptoKey> => {
  const alg = RSA_OAEP;
  return crypto.subtle.importKey(
    "spki",
    convertBase64ToArrayBuffer(SPKI),
    alg,
    true,
    [ENCRYPT]
  );
};

const deriveKey = (
  masterKey: string,
  salt = new Uint8Array(16)
): Promise<CryptoKey> => {
  const ITERATIONS = 10000;
  const HASH_ALG = "SHA-256";

  const masterKeyBuffer = convertStringToArrayBuffer(masterKey);
  return crypto.subtle
    .importKey("raw", masterKeyBuffer, { name: "PBKDF2" }, false, [
      "deriveKey",
      "deriveBits",
    ])
    .then((key) =>
      crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: ITERATIONS,
          hash: HASH_ALG,
        },
        key,
        AES_GCM,
        true,
        [ENCRYPT, DECRYPT]
      )
    );
};

const exportSymKeyToBase64 = (key: CryptoKey): Promise<string> =>
  crypto.subtle
    .exportKey("raw", key)
    .then((byteKey) => new Uint8Array(byteKey))
    .then(convertArrayBufferToBase64);

const exportPrivateKeyToPKCS8 = (key: CryptoKey): Promise<string> =>
  crypto.subtle
    .exportKey("pkcs8", key)
    .then((PKCS8) => new Uint8Array(PKCS8))
    .then(convertArrayBufferToBase64);

const importPrivateKeyFromPKCS8 = (PKCS8: string): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    "pkcs8",
    convertBase64ToArrayBuffer(PKCS8),
    RSA_OAEP,
    false,
    [DECRYPT]
  );

const importSymKeyFromBase64 = (
  base64Key: string,
  algorithm = AES_GCM
): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    "raw",
    convertBase64ToArrayBuffer(base64Key),
    algorithm,
    false,
    [ENCRYPT, DECRYPT]
  );

const symEncrypt = (
  key: CryptoKey,
  data: ArrayBuffer
): Promise<ArrayBuffer> => {
  const iv = crypto.getRandomValues(new Uint8Array(12)).buffer;
  return crypto.subtle
    .encrypt(
      {
        name: key.algorithm.name,
        iv,
        tagLength: 128,
      },
      key,
      data
    )
    .then((cipher) => mergeArrayBuffer(iv, cipher));
};

const symEncryptString = (key: CryptoKey, data: string) =>
  symEncrypt(key, convertStringToArrayBuffer(data)).then(
    convertArrayBufferToBase64
  );

const symDecrypt = (
  key: CryptoKey,
  ivData: ArrayBuffer
): Promise<ArrayBuffer> => {
  const iv = ivData.slice(0, 12);
  const data = ivData.slice(12, ivData.byteLength);

  return crypto.subtle.decrypt(
    {
      name: key.algorithm.name,
      iv,
      tagLength: 128,
    },
    key,
    data
  );
};

const symDecryptString = (
  key: CryptoKey,
  ivBase64Data: string
): Promise<string> =>
  symDecrypt(key, convertBase64ToArrayBuffer(ivBase64Data)).then(
    convertArrayBufferToString
  );

const asymEncrypt = (key: CryptoKey, data: ArrayBuffer) =>
  crypto.subtle.encrypt(
    {
      name: key.algorithm.name,
      // hash: { name: "SHA-256" },
    },
    key,
    data
  );

const asymEncryptString = (
  publicKey: CryptoKey,
  data: string
): Promise<string> =>
  asymEncrypt(publicKey, convertStringToArrayBuffer(data)).then(
    convertArrayBufferToBase64
  );

const asymDecrypt = (
  privateKey: CryptoKey,
  data: ArrayBuffer
): Promise<ArrayBuffer> =>
  crypto.subtle.decrypt(
    {
      name: privateKey.algorithm.name,
      // hash: { name: "SHA-256" },
    },
    privateKey,
    data
  );

const asymDecryptString = (
  privateKey: CryptoKey,
  data: string
): Promise<string> =>
  asymDecrypt(privateKey, convertBase64ToArrayBuffer(data)).then(
    convertArrayBufferToString
  );

export {
  // SYMMETRIC
  deriveKey,
  generateSymKey,
  symEncryptString,
  symDecryptString,
  exportSymKeyToBase64,
  importSymKeyFromBase64,
  generateAsymKeyPair,
  // ASYMMETRIC
  asymEncryptString,
  asymDecryptString,
  exportPrivateKeyToPKCS8,
  importPrivateKeyFromPKCS8,
  exportPublicKeyToSPKI,
  importPublicKeyFromSPKI,
};
