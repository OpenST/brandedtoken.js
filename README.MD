BrandedToken.js
============

BrandedToken.js supports interaction with BrandedToken-contracts.
The steps below describe the process of staking an EIP-20 token to create a BrandedToken on the value chain (assumed to be ethereum ) and minting (creating) a value-backed Utility Branded Token on the sidechain for use in applications.

#### Overview of different components:

1. BrandedToken: A Branded Token allows a mainstream application to create a value-backed token designed specifically for its application's context. A Branded Token implements the required and optional [EIP-20 Standard Token interface](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md).

2. GatewayComposer: A Gateway Composer facilitates staking value for branded tokens and minting a utility representation of those branded tokens with a Utility Branded Token through a gateway for use within the given application, thereby reducing both the number of transactions to execute and the number of contracts to call in order to stake and mint.

3. UtilityBrandedToken: A Utility Branded Token, which also implements the EIP-20 Standard Token interface, is the utility token representation of the Branded Token on a sidechain. This representation is orchestrated via a gateway, comprising a Gateway contract on the same chain as the Branded Token, and a CoGateway contract on the sidechain with the Utility Branded Token.

The following steps assume that nodejs and geth are installed and running.
This code was tested with geth version: 1.7.3-stable. Other higher versions should also work.

#### Basic setup

1.  Install BrandedToken.js in your project using npm

```bash
$ npm install @openstfoundation/brandedtoken.js --save

```

2.  Sync your development machine with one of the following test environments

    - https://ropsten.etherscan.io/
    - https://kovan.etherscan.io/
    - https://rinkeby.etherscan.io/

3.  Create the following addresses and fund them with gas

    - deployerAddress - address that deploys the EIP20Token, BrandedToken, UtilityBrandedToken and GatewayComposer contracts.
    - facilitator - address that calls acceptStakeRequest and rejectStakeRequest.
    - owner - address that calls GatewayComposer.requestStake.
    - worker - address that calls BrandedToken.rejectStakeRequest.



#### Creating a BrandedToken object
The Branded Token object is an entry point for developer - using the BrandedToken object, a staking can be initiated.

```js
// Creating brandedtoken.js object
const BrandedToken = require('./index.js');
const Setup = BrandedToken.EconomySetup;

```

######  Constants

Please can set below constants to addresses that you are able to control.

```js

// Initialize web3 object using the geth endpoint
const web3Provider = new Web3('http://127.0.0.1:8545');

// organization owner. Doesn't need to be eth funded.
let organizationOwner = '0xaabb1122....................';

// deployer address
let deployerAddress = '0xaabb1122....................';

// Facilitator address
let facilitator = '0xaabb1122....................';

// staker address
let staker = '0xaabb1122....................';

// worker address
let worker = '0xaabb1122....................';

let passphrase = 'some passphrase.....';

// Other constants
const gasPrice = '0x12A05F200';
const gas = 7500000;

```

###### ABI and BIN provider

brandedtoken.js comes with an in-built abi-bin provider for managing abi(s) and bin (s).

The abiBinProvider provides developers with following abi(s) and bin(s):

* [BrandedToken](https://github.com/OpenSTFoundation/brandedtoken-contracts/blob/0.10.0-alpha.1/contracts/BrandedToken.sol) (BrandedToken contract deployed on ValueChain)
* [UtilityBrandedToken](https://github.com/OpenSTFoundation/brandedtoken-contracts/blob/0.10.0-alpha.1/contracts/UtilityBrandedToken.sol) (UtilityBrandedToken contract deployed on UtilityChain)
* [GatewayComposer](https://github.com/OpenSTFoundation/brandedtoken-contracts/blob/0.10.0-alpha.1/contracts/GatewayComposer.sol) (GatewayComposer contract deployed on ValueChain per staker)

```js

// Get the MockToken ABI
let abiBinProvider = openST.abiBinProvider();
const mockTokenAbi = abiBinProvider.getABI('BrandedToken');

```


#### Deployment of contracts
To stake BrandedToken using GatewayComposer, you will need an EIP20 contract. You can
either use a pre-deployed EIP20 contract or deploy a new one as shown below (presently only deploys a new MockToken contract).

##### Deploy EIP20Token contract

The Mock Contract stands in place of the Value Token.If you have a pre-deployed ValueToken, please skip this step.

```js
const MockContractsDeployer = require('./test/utils/MockContractsDeployer');
const mockContractDeployerObject = new MockContractsDeployer(deployerAddress, web3Provider);
let eip20Token;
mockContractDeployerObject.deployMockToken().then(function(){
  eip20Token = mockContractDeployerObject.addresses.MockToken;
});
```


##### Deploy Organization contract

An Organization contract serves as an on-chain access control mechanism by assigning roles to a set of addresses.

```js
// Deploy Organization contract
const OrganizationHelper = Setup.OrganizationHelper;
const organizationHelperObject = new OrganizationHelper(web3Provider);
const organizationConfig = {
  deployer: deployerAddress,
  owner: organizationOwner,
  workers: worker,
  workerExpirationHeight: '20000000' // High expiration limit
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

##### Deploy BrandedToken contract
BrandedToken is a value-backed EIP-20 token with a fixed conversion rate against the Value Token chosen. This contract is deployed on the value chain.
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
const brandedTokenHelper = Setup.BrandedTokenHelper;
let brandedTokenAddress;
brandedTokenHelper.setup(brandedTokenHelperConfig, deployParams).then(function(){
    brandedTokenAddress = brandedTokenHelper.address;
});


```  

##### Deploy UtilityBrandedToken contract
The UtilityBrandedToken is a representation of the BrandedToken on the sidechains. Thus, this contract is deployed on the sidechain

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
const utilityBrandedTokenHelper = Setup.UtilityBrandedTokenHelper;
let utilityBrandedTokenAddress;
utilityBrandedTokenHelper.setup(utilityBrandedTokenHelperConfig, deployParams).then(function(){
    utilityBrandedTokenAddress = utilityBrandedTokenHelper.address;
});


```

##### Deploy GatewayComposer contract
Gateway composer is a contract optimizes the transactions required to perform the stake and mint process. This contract is deployed on the value chain.

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
const gatewayComposerHelper = Setup.GatewayComposerHelper;
let gatewayComposerAddress;
gatewayComposerHelper.setup(gatewayComposerConfig, deployParams).then(function(){
    gatewayComposerAddress = gatewayComposerHelper.address;
});

```

##### Deploy Gateway Mock contract
Gateway contract facilitates the transposition of the BrandedToken from the value chain to the sidechain. The contract is deployed on the value chain.

```js
let gatewayAddress;
mockContractDeployerObject.deployMockGatewayPass().then(function(){
      gatewayAddress = mockContractDeployerObject.addresses.MockGatewayPass;
});

```

#### BrandedToken Staking through GatewayComposer

##### Approve GatewayComposer for ValueToken & Calls requestStake

```js
const StakeHelper = BrandedToken.Helpers.StakeHelper;
const stakeHelperInstance = new StakeHelper(web3Provider, brandedTokenAddress, gatewayComposerAddress);
let txOptions = {
  from: owner
};
const stakeAmountInWei = '100';
const stakerGatewayNonce = 1;
let mintBTAmountInWei;
stakeHelperInstance.convertToBTToken(stakeAmountInWei, brandedTokenAddress, web3Provider, txOptions).then(function(result){
    mintBTAmountInWei = result;
});
const stakerInstance = new Staker(web3Provider, eip20Token, brandedTokenAddress, gatewayComposerAddress);
const stakeGasPrice = '0x3B9ACA00';
const stakeGasLimit = '7500000';
const beneficiary = '0xaabb1122....................';
stakerInstance.requestStake(
    mockTokenAbi,
    owner,
    stakeAmountInWei,
    mintBTAmountInWei,
    gatewayAddress,
    stakeGasPrice,
    stakeGasLimit,
    beneficiary,
    stakerGatewayNonce,
    txOptions
).then(function(){
  console.log("Request stake completed!");
})

```           

##### Facilitator collects worker signature
The facilitator is a service that facilitates progress of the stake and mint.
```js
// StakeRequest nonce stored in BrandedToken contract.
let stakeRequestNonce;
// 1. Create TypedData
const stakeRequestTypedData = stakeHelperInstance.getStakeRequestTypedData(stakeAmountInWei, stakeRequestNonce);

// 2. Generate EIP712 signature object.
const workerAccountInstance = web3Provider.eth.accounts.wallet[worker];
workerAccountInstance.signEIP712TypedData(stakeRequestTypedData).then(function(signature){
  console.log("signature:", signature);
})

```

##### Facilitator calls acceptStakeRequest

```js
const Mosaic = require('@openstfoundation/mosaic');
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
  mockTokenAbi,
  hashLockInstance.hashLock,
  web3Provider,
  txOptions
).then(function(){
  console.log("Successfully completed acceptStakeRequest!");
})
```

#### Follow below steps to run integration tests locally

Install Docker

    Download docker executable to local machine using below urls:
        https://docs.docker.com/docker-for-mac/
        https://hub.docker.com/editions/community/docker-ce-desktop-mac

Run below command from root directory of brandedtoken.js to run tests

```bash
    npm run test

```      
