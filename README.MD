BrandedToken.js
============

![Build master](https://img.shields.io/travis/OpenST/brandedtoken.js/master.svg?label=build%20master&style=flat)
![Build develop](https://img.shields.io/travis/OpenST/brandedtoken.js/develop.svg?label=build%20develop&style=flat)
![npm version](https://img.shields.io/npm/v/@openst/brandedtoken.js.svg?style=flat)
![Discuss on Discourse](https://img.shields.io/discourse/https/discuss.openst.org/topics.svg?style=flat)
![Chat on Gitter](https://img.shields.io/gitter/room/OpenST/SimpleToken.svg?style=flat)

BrandedToken.js supports interaction with BrandedToken-contracts.

The steps below describe the process of staking an EIP20Token to create a BrandedToken on the value chain (assumed to be Ethereum) and minting (creating) a value-backed Utility Branded Token on the sidechain for use in applications.

##  Setup

This library assumes that nodejs and geth are installed and running. To install BrandedToken.js in your project using npm:

```bash
$ npm install @openst/brandedtoken.js --save
```

The code works for Ethereum Byzantium and Petersburg.


## Creating a BrandedToken object

The BrandedToken object is an entry point: using the BrandedToken object, a staking can be initiated.

```js
// Creating brandedtoken.js object
const BrandedToken = require('@openst/brandedtoken.js');

```

## Deploying contracts

## Constants

Before deploying contracts, please set some constants to funded addresses that you control.

```js

// Initialize web3 object using the geth endpoint
const Web3 = require('web3');
const web3Provider = new Web3('http://127.0.0.1:8545');

// Organization owner. Doesn't need to be eth funded.
const organizationOwner = '0xaabb1122....................';

// Address of organization admin.
const organizationAdmin = '0x123abc......................';

// Deployer address
const deployerAddress = '0xaabb1122....................';

// Facilitator address
const facilitator = '0xaabb1122....................';

// Staker address
const staker = '0xaabb1122....................';

// Workers addresses
const workers = ['0xaabb1122....................'];

const passphrase = 'some passphrase.....'; // Needed for unlocking account.

// Other constants
const gasPrice = '0x12A05F200';
const gas = 7500000;

```

### Deploy EIP20Token contract

To stake BrandedToken, you will need an EIP20Token for the ValueToken. You can either use an existing EIP20Token contract or deploy a new one.

### Economy Setup

 * **Organization Setup**: An Organization contract serves as an on-chain access control mechanism by assigning roles to a set of addresses.

```js
const {Setup, ContractInteract} = require('@openst/brandedtoken.js');

const organizationConfig = {
  deployer: deployerAddress,
  owner: organizationOwner,
  admin : organizationAdmin,
  workers: workers, //Array of addresses.
  workerExpirationHeight: '20000000' // This is the block height for when the the worker is set to expire.
};
const txOptions = {
  gasPrice: '0x3B9ACA00',
  from : deployerAddress,
  gas: '7500000', // This is an optional parameter, if not passed gas will be estimated.
};

let organizationContractInstance;
let organizationAddress;

Setup.organization(originWeb3, organizationConfig, txOptions).then((instance) =>{
  organizationContractInstance = instance;
  organizationAddress = organizationContractInstance.address;
});


```   

* **Branded Token Setup**: BrandedToken is a value-backed EIP20Token with a fixed conversion rate against the ValueToken chosen. This contract is deployed on the value chain.
```js

const originBTConfig = {
  valueToken: eip20Token,
  symbol: 'BT',
  name: 'Branded Token',
  decimal: '18',
  conversionRate: 10,
  conversionRateDecimals: 5,
  organizationAddress,
};

txOptions = {
  gasPrice: '0x3B9ACA00',
  from : deployerAddress,
  gas: '7500000', // This is an optional parameter, if not passed gas will be estimated.
};

let brandedTokenAddress;
let brandedTokenContractInstance;

Setup.brandedtoken(
  originWeb3,
  originBTConfig,
  txOptions,
).then((instance) =>{
  brandedTokenContractInstance = instance;
  brandedTokenAddress = brandedTokenContractInstance.address;
});

```  

**Utility Branded Token Setup**:The UtilityBrandedToken(UBT) is a representation of the BrandedToken on a sidechain. Thus, this contract is deployed on a sidechain

```js
const auxiliaryOrganizationConfig = {
  deployer: auxiliaryDeployerAddress,
  owner: auxiliaryOwner,
  admin: auxiliaryAdmin,
  workers: auxiliaryWorkers,
  workerExpirationHeight: '2000',// Expiration height of worker keys. 
};

const auxiliaryTxOptions = {
  from : auxiliaryDeployerAddress,
  gasPrice : '0x3B9ACA00', // This is an optional parameter, if not passed gas will be estimated.
};

const auxiliaryUBTConfig = {
  valueToken: brandedTokenAddress,
  symbol: symbol,
  name: name,
  decimal: decimal,
};

const auxiliaryUBTTxOptions = {
  from : auxiliaryDeployerAddress,
  gasPrice : '0x3B9ACA00', // This is an optional parameter, if not passed gas will be estimated.
};

const originGatewayConfig = {
  token: brandedTokenAddress,
  baseToken: tokenAddress, // This is EIP20 token address, can be simple   token address.
  stateRootProvider: originAnchorAddress,
  bounty: '0', // Bounty amount in wei, paid in base token.
  organization: originOrganizationAddress,
  burner: '0x0000000000000000000000000000000000000000',
  deployer: originDeployer,
  organizationOwner: originOrganizationAdmin,
};

const auxiliaryCoGatewayConfig = {
  stateRootProvider: auxiliaryAnchorAddress,
  bounty: '0', // Bounty amount in wei, paid in base token(ETH).
  burner: '0x0000000000000000000000000000000000000000',
  deployer: auxiliaryDeployer,
  organizationOwner: auxiliaryOrganizationAdmin,
};

const originGatewayTxOptions = {
  from : originDeployerAddress,
  gasPrice : '0x3B9ACA00', // This is an optional parameter, if not passed gas will be estimated.
};

const auxiliaryCoGatewayTxOptions = {
  from : auxiliaryDeployerAddress,
  gasPrice : '0x3B9ACA00', // This is an optional parameter, if not passed gas will be estimated.
};

const auxiliaryUBTSetCoGatewayTxOptions = {
  gasPrice: '0x3B9ACA00', // This is an optional parameter, if not passed gas will be estimated.
  from: auxiliaryOrganizationAdmin,
};

let auxiliaryOrganization;
let utilityBrandedToken;
let originGateway;
let auxiliaryCoGateway;

let auxiliaryOrganizationAddress;
let utilityBrandedTokenAddress;
let originGatewayAddress;
let auxiliaryCoGatewayAddress;

Setup.utilitybrandedtoken(
  originWeb3,
  auxiliaryWeb3,
  auxiliaryOrganizationConfig,
  auxiliaryTxOptions,
  auxiliaryUBTConfig,
  auxiliaryUBTTxOptions,
  originGatewayConfig,
  auxiliaryCoGatewayConfig,
  originGatewayTxOptions,
  auxiliaryCoGatewayTxOptions,
  auxiliaryUBTSetCoGatewayTxOptions,
).then( (contractInstances) => {
   
  {
    auxiliaryOrganization,
    utilityBrandedToken,
    originGateway,
    auxiliaryCoGateway
  } = contractInstances;
  
   auxiliaryOrganizationAddress = auxiliaryOrganization.address;
   utilityBrandedTokenAddress = utilityBrandedToken.address;
   originGatewayAddress = originGateway.address;
   auxiliaryCoGatewayAddress = auxiliaryCoGateway.address;
});

```

### Deploy GatewayComposer contract
Gateway composer is a contract that optimizes the transactions required to perform the stake and mint process. This contract is deployed on the value chain.

```js
let gatewayComposerAddress;

txOptions = {
  gasPrice: '0x3B9ACA00',
  from: originDeployer,
};

ContractInteract.GatewayComposer.deploy(originWeb3, stakerAddress ,eip20Token, brandedTokenAddress, txOptions).then((instance) => {
   gatewayComposerAddress = instance.address;
});

```

## BrandedToken Stake and Mint

```js
const staker = new Staker(
      originWeb3,
      eip20Token, // Value token
      brandedTokenAddress,
      gatewayComposerAddress,
);

txOptions = {
  from: stakerAddress,
  gasPrice : '0x3B9ACA00',
};

const stakeVTAmountInWei = '100'; // Stake amount in wei
const mintBTAmountInWei = '100'; // Mint amount in wei, you can get this value for Branded Token contract interact.
const gasPrice = '100'; 
const gasLimit = '100';
const beneficiary = '0x123abcd................'; // Address of auxiliary chain.
const stakerGatewayNonce = '1'; // You can get this value from EIP20Gateway contract interact.

const requestStakeReceipt;

staker.requestStake(
      stakeVTAmountInWei,
      mintBTAmountInWei,
      gatewayAddress,
      gasPrice,
      gasLimit,
      beneficiary,
      stakerGatewayNonce,
      txOptions,
).then( (receipt) => {
   requestStakeReceipt = receipt;
});

const facilitator = new Facilitator(
      originWeb3,
      eip20Token,
      brandedTokenAddress,
      gatewayComposerAddress,
);

const facilitatorReceipt;
facilitator.acceptStakeRequest(
      stakeRequestHash, // You can get this hash from event in request stake receipt.
      signature, // This is signature of the worker key.
      bountyInWei, // Use EIP20Gateway interact to get bounty.
      hashLock,   
      txOptions,
    ).then( (receipt) => {
      facilitatorReceipt = receipt;
    });
```
Now you can use mosaic facilitator to progress stake and mint. Refer [this](https://github.com/OpenST/mosaic.js#facilitator).

## ABI and BIN provider

brandedtoken.js comes with an abi-bin provider for managing abi(s) and bin(s).

The abiBinProvider provides abi(s) and bin(s) for the following contracts:

* [BrandedToken](https://github.com/OpenST/brandedtoken-contracts/blob/release-0.10/contracts/BrandedToken.sol) (BrandedToken contract deployed on ValueChain)
* [UtilityBrandedToken](https://github.com/OpenST/brandedtoken-contracts/blob/release-0.10/contracts/UtilityBrandedToken.sol) (UtilityBrandedToken contract deployed on UtilityChain)
* [GatewayComposer](https://github.com/OpenST/brandedtoken-contracts/blob/release-0.10/contracts/GatewayComposer.sol) (GatewayComposer contract deployed on ValueChain per staker)

```js

// Fetching ABI examples.
let abiBinProvider = new BrandedToken.AbiBinProvider();
const brandedTokenAbi = abiBinProvider.getABI('BrandedToken');

```

## Logger

* By default logs are published on the console.
* Follow below steps to enable publishing of logs in a file: 
  * Set environment variable: `ENABLE_BRANDED_TOKEN_JS_LOGGER=true`
  * Set log file location: `BRANDED_TOKEN_JS_LOGGER_PATH=~`

## Repository set-up and tests

```bash
    git clone https://github.com/OpenST/brandedtoken.js.git
    cd brandedtoken.js
    npm install
    npm run test
    
    # Requires docker:
    npm run test:integration

```      
