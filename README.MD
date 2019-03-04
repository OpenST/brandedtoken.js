BrandedToken.js
============

![Build master](https://img.shields.io/travis/OpenSTFoundation/brandedtoken.js/master.svg?label=build%20master&style=flat)
![Build develop](https://img.shields.io/travis/OpenSTFoundation/brandedtoken.js/develop.svg?label=build%20develop&style=flat)
![npm version](https://img.shields.io/npm/v/@openstfoundation/brandedtoken.js.svg?style=flat)
![Discuss on Discourse](https://img.shields.io/discourse/https/discuss.openst.org/topics.svg?style=flat)
![Chat on Gitter](https://img.shields.io/gitter/room/OpenSTFoundation/SimpleToken.svg?style=flat)

BrandedToken.js supports interaction with BrandedToken-contracts.

The steps below describe the process of staking an EIP20Token to create a BrandedToken on the value chain (assumed to be Ethereum) and minting (creating) a value-backed Utility Branded Token on the sidechain for use in applications.

##  Setup

This library assumes that nodejs and geth are installed and running. To install BrandedToken.js in your project using npm:

```bash
$ npm install @openstfoundation/brandedtoken.js --save
```

The code works for Ethereum Byzantium and Petersburg.


## Creating a BrandedToken object

The BrandedToken object is an entry point: using the BrandedToken object, a staking can be initiated.

```js
// Creating brandedtoken.js object
const BrandedToken = require('@openstfoundation/brandedtoken.js');

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
const {Setup} = require('@openstfoundation/brandedtoken.js');

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
  gas: '7500000', // This is optional parameter, if not passed gas will be estimated.
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
  gas: '7500000', // This is optional parameter, if not passed gas will be estimated.
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

**Utility Branded Token Setup**:The UtilityBrandedToken is a representation of the BrandedToken on a sidechain. Thus, this contract is deployed on a sidechain

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
      gasPrice : '0x3B9ACA00',
    };
    const auxiliaryUBTConfig = {
      valueToken: brandedTokenAddress,
      symbol: symbol,
      name: name,
      decimal: decimal,
    };

    const auxiliaryTxUBTOptions = {
      from : auxiliaryDeployerAddress,
      gasPrice : '0x3B9ACA00',
    };

    const originGatewayConfig = {
      token: brandedTokenAddress,
      baseToken: tokenAddress, // This is EIP20 token address, can be simple token address.
      stateRootProvider: originAnchorAddress,
      bounty: '0', // Bounty amount in wei, paid in base token.
      organization: originOrganizationAddress,
      burner: '0x0000000000000000000000000000000000000000',
      deployer: originDeployer,
      organizationOwner: originOrganizationAdmin,
    };

    const auxiliaryGatewayConfig = {
      stateRootProvider: auxiliaryAnchorAddress,
      bounty: '0',// Bounty amount in wei, paid in base token(ETH).
      burner: '0x0000000000000000000000000000000000000000',
      deployer: auxiliaryDeployer,
      organizationOwner: auxiliaryOrganizationAdmin,
    };

    const originGatewayTxOptions = {
      from : originDeployerAddress,
      gasPrice : '0x3B9ACA00',
    };
    const auxiliaryCoGatewayTxOptions = {
      from : auxiliaryDeployerAddress,
      gasPrice : '0x3B9ACA00',
    };

    const auxiliaryUBTSetCoGatewayTxOptions = {
      gasPrice: '0x3B9ACA00',
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
      auxiliaryTxUBTOptions,
      originGatewayConfig,
      auxiliaryGatewayConfig,
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
const gatewayComposerConfig = {
    deployer: deployerAddress,
    owner: staker,
    valueToken: eip20Token,
    brandedToken: brandedTokenAddress
};
deployParams = {
  gas: '7500000',
  gasPrice: '0x3B9ACA00'
};
const gatewayComposerHelper = new Setup.GatewayComposerHelper(web3Provider);
let gatewayComposerAddress;
gatewayComposerHelper.setup(gatewayComposerConfig, deployParams).then(function(){
    gatewayComposerAddress = gatewayComposerHelper.address;
});

```

### Deploy Gateway contract
Gateway contract facilitates the transposition of the BrandedToken from the value chain to the sidechain. The contract is deployed on the value chain.
You can either use an existing EIP20Token contract or deploy a new one.

## BrandedToken Staking through GatewayComposer

### Approve GatewayComposer for ValueToken and call requestStake

Please make sure staker has sufficient stake amount before calling this step.

```js
const StakeHelper = BrandedToken.Helpers.StakeHelper;
const stakeHelperInstance = new StakeHelper(web3Provider, brandedTokenAddress, gatewayComposerAddress);
let txOptions = {
  from: staker,
  gas: '7500000',
};
const stakeAmountInWei = '10000000000';

// stakerGatewayNonce is the nonce of the staker address stored in Gateway contract. Alternatively it can also be fetched from Gateway.getNonce(stakeAddress) method.
const stakerGatewayNonce = 1;
let mintBTAmountInWei;
stakeHelperInstance.convertToBTToken(stakeAmountInWei, brandedTokenAddress, web3Provider, txOptions).then(function(mintAmount){
    mintBTAmountInWei = mintAmount;
});
const stakerInstance = new Staker(web3Provider, eip20Token, brandedTokenAddress, gatewayComposerAddress);
const stakeGasPrice = '0x3B9ACA00';
const stakeGasLimit = '7500000';
const beneficiary = '0xaabb1122....................';
const eip20TokenAbi = ''; // Add JSON parsed eip20Token ABI here
stakerInstance.requestStake(
    eip20TokenAbi,
    staker,
    stakeAmountInWei,
    mintBTAmountInWei,
    gatewayAddress,
    stakeGasPrice,
    stakeGasLimit,
    beneficiary,
    stakerGatewayNonce,
    txOptions
).then(function(){
    console.log("Successfully completed requestStake!");
})


```           

### Facilitator collects worker signature

The facilitator is a service that facilitates progress of the stake and mint.
You must have access to the private key to sign with the worker account. Please see web3 documentation for signing with accounts.

```js
// StakeRequest nonce stored in BrandedToken contract.
let stakeRequestNonce = 0;
// 1. Create TypedData
const stakeRequestTypedData = stakeHelperInstance.getStakeRequestTypedData(stakeAmountInWei, stakeRequestNonce);

// 2. Generate EIP712 signature object.
// Worker account is unlocked which means access to the private key.
const signature = workerAccount.signEIP712TypedData(stakeRequestTypedData);
```

### Facilitator calls acceptStakeRequest

```js
const hashLockInstance = Mosaic.Utils.createSecretHashLock();
const gatewayContractInstance = new Mosaic.ContractInteract.EIP20Gateway(web3Provider, gatewayAddress);
let bountyAmountInWei;
gatewayContractInstance.getBounty().then(function(result){
  bountyAmountInWei = result;
});
const Facilitator = BrandedToken.Helpers.Facilitator;
const facilitatorInstance = new Facilitator(web3Provider, eip20Token, brandedTokenAddress, gatewayComposerAddress, facilitator);
txOptions = {
  from: facilitator,
  gas: '7500000'
};    
let stakeRequestHash; // stakeRequestHash unique per stake request stored in GatewayComposer.stakeRequests mapping
facilitatorInstance.acceptStakeRequest(
  stakeRequestHash,
  signature,
  bountyAmountInWei,
  eip20TokenAbi,
  hashLockInstance.hashLock,
  web3Provider,
  txOptions
).then(function(){
  console.log("Successfully completed acceptStakeRequest!");
})
```

## ABI and BIN provider

brandedtoken.js comes with an abi-bin provider for managing abi(s) and bin(s).

The abiBinProvider provides abi(s) and bin(s) for the following contracts:

* [BrandedToken](https://github.com/OpenSTFoundation/brandedtoken-contracts/blob/0.10.0-alpha.1/contracts/BrandedToken.sol) (BrandedToken contract deployed on ValueChain)
* [UtilityBrandedToken](https://github.com/OpenSTFoundation/brandedtoken-contracts/blob/0.10.0-alpha.1/contracts/UtilityBrandedToken.sol) (UtilityBrandedToken contract deployed on UtilityChain)
* [GatewayComposer](https://github.com/OpenSTFoundation/brandedtoken-contracts/blob/0.10.0-alpha.1/contracts/GatewayComposer.sol) (GatewayComposer contract deployed on ValueChain per staker)

```js

// Fetching ABI examples.
let abiBinProvider = new BrandedToken.AbiBinProvider();
const brandedTokenAbi = abiBinProvider.getABI('BrandedToken');

```

## Tests

Tests require docker-compose. To run the tests, execute below command from root directory.

```bash
    npm run test

```      
