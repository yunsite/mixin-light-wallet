import CryptoJS from 'crypto-js';
import Lockr from 'lockr';
import { DEFAULT_NETWORK } from '../networks';
import { WALLET_NAME } from '../../config/Constants';

const getOrCreateAppSalt = () => {
  return new Promise(resolve => {
    const appSalt = Lockr.get(`${WALLET_NAME}-appSalt`);
    if (appSalt) {
      resolve(appSalt);
    } else {
      const newAppSalt = CryptoJS.lib.WordArray.random(32).toString();
      Lockr.set(`${WALLET_NAME}-appSalt`, newAppSalt);
      resolve(newAppSalt);
    }
  });
};

const setPasswordHash = passwordHash => {
  return new Promise(resolve => {
    Lockr.set(`${WALLET_NAME}-passwordHash`, passwordHash);
    resolve(passwordHash);
  });
};

const getPasswordHash = () => {
  return new Promise(resolve => {
    const passwordHash = Lockr.get(`${WALLET_NAME}-passwordHash`);
    if (passwordHash) {
      resolve(passwordHash);
    } else {
      resolve(null);
    }
  });
};

const setAccounts = accounts => {
  return new Promise(resolve => {
    Lockr.set(`${WALLET_NAME}-accounts`, accounts);
    resolve(accounts);
  });
};

const getAccounts = () => {
  return new Promise(resolve => {
    const accounts = Lockr.get(`${WALLET_NAME}-accounts`);
    if (accounts) {
      resolve(accounts);
    } else {
      resolve([]);
    }
  });
};

const setNetwork = network => {
  return new Promise(resolve => {
    Lockr.set(`${WALLET_NAME}-network`, network);
    resolve(network);
  });
};

const getNetworkOrDefault = () => {
  return new Promise(resolve => {
    const network = Lockr.get(`${WALLET_NAME}-network`);
    if (network) {
      resolve(network);
    } else {
      resolve(DEFAULT_NETWORK);
    }
  });
};

export const localStorage = {
  getOrCreateAppSalt,
  setPasswordHash,
  getPasswordHash,
  setAccounts,
  getAccounts,
  setNetwork,
  getNetworkOrDefault,
};
