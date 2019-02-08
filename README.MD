BrandedToken.js
============

BrandedToken.js supports interaction with BrandedToken-contracts.

The steps below describe the process of staking an EIP20Token to create a BrandedToken on the value chain (assumed to be Ethereum) and minting (creating) a value-backed Utility Branded Token on the sidechain for use in applications.

##  Setup
This library assumes that nodejs and geth are installed and running. To install BrandedToken.js in your project using npm:

```bash
$ npm install @openstfoundation/brandedtoken.js --save
```

This code was tested with geth version: 1.7.3-stable. Other higher versions should also work.


## Creating a BrandedToken object
The BrandedToken object is an entry point: using the BrandedToken object, a staking can be initiated.

```js
// Creating brandedtoken.js object
const BrandedToken = require('./index.js');

```


## ABI and BIN provider

brandedtoken.js comes with an abi-bin provider for managing abi(s) and bin(s).

The abiBinProvider provides abi(s) and bin(s) for the following contracts:

* [BrandedToken](https://github.com/OpenSTFoundation/brandedtoken-contracts/blob/0.10.0-alpha.1/contracts/BrandedToken.sol) (BrandedToken contract deployed on ValueChain)
* [UtilityBrandedToken](https://github.com/OpenSTFoundation/brandedtoken-contracts/blob/0.10.0-alpha.1/contracts/UtilityBrandedToken.sol) (UtilityBrandedToken contract deployed on UtilityChain)
* [GatewayComposer](https://github.com/OpenSTFoundation/brandedtoken-contracts/blob/0.10.0-alpha.1/contracts/GatewayComposer.sol) (GatewayComposer contract deployed on ValueChain per staker)

```js

// Get the MockToken ABI
let abiBinProvider = new BrandedToken.AbiBinProvider();
const brandedTokenAbi = abiBinProvider.getABI('BrandedToken');

```


## Deploying contracts

## Constants
Before deploying contracts, please set some constants to funded addresses that you control.

```js

// Initialize web3 object using the geth endpoint
const Web3 = require('web3');
const web3Provider = new Web3('http://127.0.0.1:8545');

// organization owner. Doesn't need to be eth funded.
const organizationOwner = '0xaabb1122....................';

// deployer address
const deployerAddress = '0xaabb1122....................';

// Facilitator address
const facilitator = '0xaabb1122....................';

// staker address
const staker = '0xaabb1122....................';

// worker address
const worker = '0xaabb1122....................';

const passphrase = 'some passphrase.....';

// Other constants
const gasPrice = '0x12A05F200';
const gas = 7500000;

```

### Deploy EIP20Token contract

To stake BrandedToken, you will need an EIP20Token for the ValueToken. You can either use an existing EIP20Token contract or deploy a new one as shown below (presently only deploys a new MockToken contract). If you have an existing ValueToken, please skip this step.

```js
const MockContractsDeployer = require('./test/utils/MockContractsDeployer');
const mockContractDeployerObject = new MockContractsDeployer(deployerAddress, web3Provider);
let eip20Token;
mockContractDeployerObject.deployMockToken().then(function(){
  eip20Token = mockContractDeployerObject.addresses.MockToken;
});
```


### Deploy Organization contract

An Organization contract serves as an on-chain access control mechanism by assigning roles to a set of addresses.

```js
// Deploy Organization contract
const Setup = BrandedToken.EconomySetup;
const OrganizationHelper = Setup.OrganizationHelper;
const organizationHelperObject = new OrganizationHelper(web3Provider);
const organizationConfig = {
  deployer: deployerAddress,
  owner: organizationOwner,
  workers: worker,
  workerExpirationHeight: '20000000' // This is the block height for when the the worker is set to expire.
};
let deployParams = {
  gas: '7500000',
  gasPrice: '0x3B9ACA00'
};
let organizationAddress;
organizationHelperObject.setup(organizationConfig, deployParams).then(function(){
    organizationAddress = organizationHelperObject.address;
});


```   

### Deploy BrandedToken contract
BrandedToken is a value-backed EIP20Token with a fixed conversion rate against the ValueToken chosen. This contract is deployed on the value chain.
```js
const brandedTokenHelperConfig = {
    deployer: deployerAddress,
    valueToken: eip20Token,
    symbol: 'BT',
    name: 'MyBrandedToken',
    decimals: '18',
    conversionRate: '10',
    conversionRateDecimals: 5,
    organization: organizationAddress
};
deployParams = {
  gas: '7500000',
  gasPrice: '0x3B9ACA00'
};
const brandedTokenHelperObject = new Setup.BrandedTokenHelper(web3Provider);
let brandedTokenAddress;
brandedTokenHelperObject.setup(brandedTokenHelperConfig, deployParams).then(function(){
    brandedTokenAddress = brandedTokenHelperObject.address;
});


```  

### Deploy UtilityBrandedToken contract
The UtilityBrandedToken is a representation of the BrandedToken on a sidechain. Thus, this contract is deployed on a sidechain

```js
const utilityBrandedTokenHelperConfig = {
    deployer: deployerAddress,
    token: brandedTokenAddress,
    symbol: "UBT",
    name: "MyBrandedToken",
    decimals: "18",
    organization: organizationAddress
};
deployParams = {
  gas: '7500000',
  gasPrice: '0x3B9ACA00'
};
const utilityBrandedTokenHelper = new Setup.UtilityBrandedTokenHelper(web3Provider);
let utilityBrandedTokenAddress;
utilityBrandedTokenHelper.setup(utilityBrandedTokenHelperConfig, deployParams).then(function(){
    utilityBrandedTokenAddress = utilityBrandedTokenHelper.address;
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

### Deploy Gateway Mock contract
Gateway contract facilitates the transposition of the BrandedToken from the value chain to the sidechain. The contract is deployed on the value chain.
Please skip this step if real Gateway contract address is available.

```js
let gatewayAddress;
mockContractDeployerObject.deployMockGatewayPass().then(function(){
      gatewayAddress = mockContractDeployerObject.addresses.MockGatewayPass;
});

```

## BrandedToken Staking through GatewayComposer

### Approve GatewayComposer for ValueToken and call requestStake

```js
const StakeHelper = BrandedToken.Helpers.StakeHelper;
const stakeHelperInstance = new StakeHelper(web3Provider, brandedTokenAddress, gatewayComposerAddress);
let txOptions = {
  from: staker
};
const stakeAmountInWei = '1000000000000';

// stakerGatewayNonce is the nonce of the staker address stored in Gateway contract. Alternatively it can also be fetched from Gateway.getNonce(stakeAddress) method.
const stakerGatewayNonce = 1;
let mintBTAmountInWei;
stakeHelperInstance.convertToBTToken(stakeAmountInWei, brandedTokenAddress, web3Provider, txOptions).then(function(result){
    mintBTAmountInWei = result;
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
).then(console.log)


```           

### Facilitator collects worker signature

The facilitator is a service that facilitates progress of the stake and mint.

```js
// StakeRequest nonce stored in BrandedToken contract.
let stakeRequestNonce = 0;
// 1. Create TypedData
const stakeRequestTypedData = stakeHelperInstance.getStakeRequestTypedData(stakeAmountInWei, stakeRequestNonce);

// 2. Generate EIP712 signature object.
// You will need to have worker key store file for signing.
const workerKeyStoreData = '...'; //The encrypted keystore JSON.
const workerAccount = web3Provider.eth.accounts.decrypt(workerKeyStoreData, passphrase);
const signature = workerAccount.signEIP712TypedData(stakeRequestTypedData);

```

### Facilitator calls acceptStakeRequest

```js
const Mosaic = require('@openstfoundation/mosaic.js');
const hashLockInstance = Mosaic.Helpers.StakeHelper.createSecretHashLock();
const gatewayContractInstance = Mosaic.Contracts.getEIP20Gateway(web3Provider, gatewayAddress);
let bountyAmountInWei;
gatewayContractInstance.methods.bounty().call().then(function(result){
  bountyAmountInWei = result;
});
const Facilitator = BrandedToken.Helpers.Facilitator;
const facilitatorInstance = new Facilitator(web3Provider, eip20Token, brandedTokenAddress, gatewayComposerAddress, facilitator);
txOptions = {
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

## Tests

Tests require docker-compose. To run the tests, execute below command from root directory.

```bash
    npm run test

```      
