import uuid from 'uuid/v4';
import KJUR from 'jsrsasign';
import $ from 'jquery';
import MixinUtils from 'bot-api-js-client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import presetAssets from '../config/preset-assets';
import { getNodeUrl, MAINNET } from './networks';

const config = {
  clientId: 'ea7548bc-57d1-4839-988a-cb90d2230e4a',
  sessionId: '0b1a612b-b890-4f48-a64e-63092fb73022',
  privateKey: `-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQCo7/SkOD6y43wo9EXGYifltxD8RshAbTd6K177yrYw6dS5KEtS
EuhD7lFx4k72haPQQHhWIacovMxnDMirEH2GJ6swRwkBpGZnM/m/caxxRAvY/GoN
V8orz3fTmvb+SpBe7ddWBUqDJjt//oVpl/P/c+uP9+xnUn0y0VAB7v358wIDAQAB
AoGAbAE1C8R1uVKcr2Y0MbfRQBjBADiUkDQDEtUlnZ6kyjLEcDflp6w02DFF2qRP
zWX1LA/7nz1WrEHAAGX46Pza8lnjep9mPzXxYyhOLMkTNfwc7i8YL3CavKPOwWn2
hNmIHMRVeBmoF5EduXFhg7Mp83O3ysEYMVpGrTmekbrVR4ECQQD8/Atrre0WuGF3
K/uCBnqcNw7YFEeKmVLbqaBujKzM1j/Xb2XmCUgY1jJyyTmUyGTpt/zMRCF48VKY
bmX5V61BAkEAqvNzKyiMJFdF4zcCJVrHylpTkozCPzBWvxSY4AFCW0Rq+3v1IzgO
7NWIZvQeC4flgr7whM0xQzer/iEjXYr2MwJBAPRrN0WDtqra3R/cWJSZWeCPuUG+
5hfcZpdf3Waxd0o4PVoRgKutkACfAgKws3cx3X2Jiy53LLfCwAARuWgb84ECQBoC
+R80CD7vWJ7+G8F7UrMjk1vVNylOPaTNiYVsK6CfhHfHoME/ImY/B4ZC1t+CShXe
39IVNs23huAgQrVVE6kCQQCzG6Ip6Iq0R5MSpg1uIDSrT79fIKwggnbw78Us6BjH
s3EbqE4Qb/Qev3aDbOaIxbjhxqjY2rTRm5VPNr3iM4u1
-----END RSA PRIVATE KEY-----`,
};

const MIXIN_URL = getNodeUrl(MAINNET);
const TIMEOUT = 3600;
const mixinUtils = new MixinUtils();

const getRequestSignature = (method, uri, body) => {
  if (!body) {
    body = '';
  }
  const payload =
    method +
    uri +
    (typeof body === 'object' ? JSON.stringify(body) : body.toString());
  const signature = crypto
    .createHash('sha256')
    .update(payload)
    .digest('hex');
  return signature;
};

const getJwtToken = (clientId, sessionId, privateKey, method, uri, body) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expireAt = issuedAt + TIMEOUT;
  const payload = {
    uid: clientId,
    sid: sessionId,
    iat: issuedAt,
    exp: expireAt,
    jti: uuid(),
    sig: getRequestSignature(method, uri, body),
  };
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS512' });
  return token;
};

const strip = key => {
  if (key.indexOf('-----') !== -1) {
    return key.split('-----')[2].replace(/\r?\n|\r/g, '');
  }
};

const signPin = (pin, userData) => {
  return mixinUtils.signEncryptedPin(
    pin,
    userData.pinToken,
    userData.sessionId,
    userData.privateKey
  );
};

const error = (resp, callback) => {
  console.error(resp.error);
};

const send = (token, method, url, params, callback) => {
  const requestObject = {
    type: method,
    url: url,
    contentType: 'application/json',
    beforeSend: xhr => {
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    },
    success: resp => {
      let consumed = false;
      if (typeof callback === 'function') {
        consumed = callback(resp);
      }
      if (!consumed && resp.error !== null && resp.error !== undefined) {
        error(resp);
      }
    },
    error: event => {
      error(event.responseJSON, callback);
    },
  };

  if (params) {
    requestObject.data = JSON.stringify(params);
  }
  $.ajax(requestObject);
};

const request = (method, path, params, userData, callback) => {
  const url = MIXIN_URL + path;
  let token = '';
  if (userData) {
    token = getJwtToken(
      userData.clientId,
      userData.sessionId,
      userData.privateKey,
      method,
      path,
      params
    );
  } else {
    token = getJwtToken(
      config.clientId,
      config.sessionId,
      config.privateKey,
      method,
      path,
      params
    );
  }
  return send(token, method, url, params, callback);
};

// https://developers.mixin.one/api/alpha-mixin-network/app-user/
export const createUser = () => {
  const keyPair = KJUR.KEYUTIL.generateKeypair('RSA', 1024);
  keyPair.prvKeyObj.isPrivate = true;
  const privateKey = KJUR.KEYUTIL.getPEM(keyPair.prvKeyObj, 'PKCS1PRV');
  const publicKey = strip(KJUR.KEYUTIL.getPEM(keyPair.pubKeyObj));
  const params = {
    session_secret: publicKey,
    full_name: uuid().toLowerCase(),
  };

  return new Promise((resolve, reject) => {
    request('POST', '/users', params, null, resp => {
      if (resp.error) {
        reject(resp.error);
        return;
      }
      resp.data.privateKey = privateKey;
      resolve(resp.data);
    });
  });
};

// https://developers.mixin.one/api/alpha-mixin-network/create-pin/
export const updatePin = (userData, oldPin, newPin) => {
  let old_pin = '';
  if (oldPin !== '') {
    old_pin = signPin(oldPin, userData);
  }
  const params = {
    old_pin: old_pin,
    pin: signPin(newPin, userData),
  };

  return new Promise((resolve, reject) => {
    request('POST', '/pin/update', params, userData, resp => {
      if (resp.error) {
        reject(resp.error);
        return;
      }
      resolve(resp.data);
    });
  });
};

// https://developers.mixin.one/api/alpha-mixin-network/read-assets/
const loadAssets = userData => {
  return new Promise((resolve, reject) => {
    request('GET', '/assets', undefined, userData, resp => {
      if (resp.error) {
        reject(resp.error);
        return;
      }
      resolve(resp.data);
    });
  });
};

export const loadAssetsWithPreset = async userData => {
  const assets = await loadAssets(userData);
  let mergedAssets = presetAssets;
  for (const asset of assets) {
    // remove the preset one, then re-add
    mergedAssets = mergedAssets.filter(a => a.asset_id !== asset.asset_id);
    mergedAssets.push(asset);
  }
  mergedAssets = mergedAssets.sort((a, b) => {
    if (!a.balance && !b.balance) {
      return 0;
    } else if (!b.balance) {
      return -1;
    } else {
      return b.balance - a.balance;
    }
  });
  return mergedAssets;
};

// https://developers.mixin.one/api/alpha-mixin-network/read-asset/
export const loadAsset = (asset, userData) => {
  return new Promise((resolve, reject) => {
    request('GET', `/assets/${asset.asset_id}`, undefined, userData, resp => {
      if (resp.error) {
        reject(resp.error);
        return;
      }
      resolve(resp.data);
    });
  });
};

// https://developers.mixin.one/api/alpha-mixin-network/deposit/
export const loadDepositInfo = (asset, userData) => {
  return loadAsset(asset, userData);
};

const loadWithdrawalInfo = (asset, userData) => {
  return loadAsset(asset, userData);
};

// https://developers.mixin.one/api/alpha-mixin-network/withdrawal/
export const withdraw = async (asset, userData, withdrawData) => {
  const data = await loadWithdrawalInfo(asset, userData);
  return new Promise((resolve, reject) => {
    let params = {
      asset_id: asset.asset_id,
      pin: signPin(withdrawData.withdrawPin, userData),
    };

    if (data.public_key) {
      // Non-EOS
      params['label'] = asset.symbol;
      params['public_key'] = withdrawData.withdrawTo;
    } else if (data.account_name && data.account_tag) {
      // EOS
      params['account_name'] = withdrawData.withdrawTo;
      params['account_tag'] = withdrawData.withdrawMemo;
    } else {
      reject('Token not supported!');
      return;
    }

    request('POST', '/addresses', params, userData, resp => {
      if (resp.error) {
        reject(resp.error);
        return;
      }
      params = {
        address_id: resp.data.address_id,
        amount: withdrawData.withdrawAmount,
        pin: signPin(withdrawData.withdrawPin, userData),
        trace_id: uuid().toLowerCase(),
        memo: withdrawData.withdrawMemo,
      };

      request('POST', '/withdrawals', params, userData, resp => {
        if (resp.error) {
          reject(resp.error);
          return;
        }
        resolve(resp.data);
      });
    });
  });
};

// https://developers.mixin.one/api/alpha-mixin-network/transfer/
export const transfer = async (asset, userData, transferData) => {
  return new Promise((resolve, reject) => {
    const params = {
      asset_id: asset.asset_id,
      opponent_id: transferData.sendTo,
      amount: transferData.sendAmount,
      pin: signPin(transferData.sendPin, userData),
      trace_id: uuid().toLowerCase(),
      memo: transferData.sendMemo,
    };

    request('POST', '/transfers', params, userData, resp => {
      if (resp.error) {
        reject(resp.error);
        return;
      }
      resolve(resp.data);
    });
  });
};

export const exportPrivateKey = userData => {
  return Buffer.from(
    JSON.stringify({
      key: userData.privateKey,
      uid: userData.clientId,
      pintoken: userData.pinToken,
      sid: userData.sessionId,
    })
  ).toString('base64');
};

// https://developers.mixin.one/api/alpha-mixin-network/verify-pin/
export const verifyPin = (pin, userData) => {
  return new Promise((resolve, reject) => {
    const params = {
      pin: signPin(pin, userData),
    };
    request('POST', '/pin/verify', params, userData, resp => {
      if (resp.error) {
        reject(resp.error);
        return;
      }
      resolve(resp.data);
    });
  });
};

// No doc yet
export const loadTransactions = (userData, limit = 500, offset = 0) => {
  return new Promise((resolve, reject) => {
    const path = `/snapshots?limit=${limit}&offset=${offset}`;
    request('GET', path, null, userData, resp => {
      if (resp.error) {
        reject(resp.error);
        return;
      }
      resolve(resp.data);
    });
  });
};
