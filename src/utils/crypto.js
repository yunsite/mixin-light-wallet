import AES from 'crypto-js/aes';
import CryptoJS from 'crypto-js';

import passwordValidator from 'password-validator';

import { backgroundPage } from './backgroundPage';

export const isAddress = address => {
  return address && address.length > 0;
};

export const isAppPasswordValid = password => {
  const schema = new passwordValidator();
  schema
    .is()
    .min(6) // Minimum length 6
    .is()
    .max(20) // Maximum length 20
    .has()
    .not()
    .spaces(); // Should not have spaces

  return password && schema.validate(password);
};

export const isPrivateKeyValid = privateKey => {
  return privateKey && privateKey.length >= 1000;
};

export const getTxAbbreviation = tx => {
  if (tx) {
    return tx.substr(0, 8) + '...' + tx.substr(tx.length - 8, 8);
  } else {
    return 'pending...';
  }
};

export const getAddressAbbreviation = address => {
  if (address) {
    return address.substr(0, 8) + '...' + address.substr(address.length - 8, 8);
  } else {
    return '';
  }
};

export const getActiveUserData = async activeAccount => {
  const passwordHashInBackground = await backgroundPage.getPasswordHash();
  const userDataStr = AES.decrypt(
    activeAccount.encryptedUserData,
    passwordHashInBackground
  ).toString(CryptoJS.enc.Utf8);
  return JSON.parse(userDataStr);
};
