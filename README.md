# Mixin Light Wallet

![Mixin Light Wallet](https://github.com/mixinlight/mixin-light-wallet/blob/master/assets/ScreenShot.png "Mixin Light Wallet")

## Install from google store
[Chrome Web Store - Mixin Light Wallet](https://chrome.google.com/webstore/detail/mixin-light-wallet/fkooimefaedifbjpkinhckcdpmgmihhe)

## Install the wallet from source code

Prerequisite: yarn, git, node

1. Git clone to local folder

```git clone https://github.com/MixinLight/mixin-light-wallet```

2. Add dependencies and build the source

```yarn```

```yarn build```

3. Installation
Open chrome, go to `chrome://extensions/`
Turn on developer mode
Click "Load unpacked"

![Build from source](https://github.com/mixinlight/mixin-light-wallet/blob/master/assets/chromeextension.png "Chrome Extension")

Locate ```mixin-light-wallet/build``` folder, click select
You should see plugin added to Chrome plugin bar,click to start to use it.


## Introduction

This project is using [Mixin API](https://developers.mixin.one/api).


## Features

1. Access protected by wallet password. After the user signs out or closes Chrome, they need to put the same password to access the wallet again. It's similar to MetaMask.
2. All confidential info like Private Key, Session Id is encrypted by the hashed wallet password and securely stored.
3. Multiple accounts support, the user can create and switch accounts within one wallet.
4. Create Mixin account with user's pin.
5. Import Mixin account with Mixin pin, it can import the account from https://wallet.mixcoin.one/
6. Export Mixin account, the exported private key can be imported into https://wallet.mixcoin.one/
7. Transfer and receive all supported 49,500+ assets within Mixin Network.
8. Deposit and withdraw assets between Mixin and other Blockchain.
9. Support all Mixin supported assets.
10. Display all transaction history. The user can navigate to https://mixin.one/snapshots to see the transaction details.
11. Switch networks, currently Mixin Network doesn't have Testnet. Mixin Light Wallet can support Testnet once Mixin adds Testnet support.
12. Mixin current price and price changes.

Basically, we have implemented the features in MetaMask, and also add Mixin specific features like Deposit and Withdraw.

