BrandedToken.js
============
Description <TBD>

#### Overview of different components:

1. BrandedToken: Description <Amulya TBD>

2. GatewayComposer: Description <Amulya TBD>

3. UtilityBrandedToken: Description <Amulya TBD>

#### Basic setup

1.  Install the following packages

```bash
sudo apt-get update
sudo apt-get install nodejs
sudo apt-get install npm

```

2.  Install BrandedToken.js in your project using npm

```bash
$ npm install @openstfoundation/brandedtoken.js --save

```

3.  Install Geth

    This code was tested with geth version: 1.7.3-stable. Other higher versions should also work.

```bash
curl https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.7.3-4bb3c89d.tar.gz | tar xvz
mv geth-linux-amd64-1.7.3-4bb3c89d /usr/local/bin
ln -s /usr/local/bin/geth-linux-amd64-1.7.3-4bb3c89d/geth /usr/local/bin/geth
export PATH="$PATH:/usr/local/bin/geth-linux-amd64-1.7.3-4bb3c89d"

```
        
4.  Sync your development machine with one of the following test environments

    - https://ropsten.etherscan.io/
    - https://kovan.etherscan.io/
    - https://rinkeby.etherscan.io/
    
5.  Create the following addresses and fund them with gas

    - deployerAddress - address that deploys the EIP20Token, BrandedToken, UtilityBrandedToken and GatewayComposer contracts.
    - facilitator - address that calls acceptStakeRequest and rejectStakeRequest.
    - owner - address that calls GatewayComposer.requestStake.
    - worker - address that calls BrandedToken.rejectStakeRequest. 

##### Follow below steps to run integration tests locally

Install Docker

    Download docker executable to local machine using below urls:
        https://docs.docker.com/docker-for-mac/
        https://hub.docker.com/editions/community/docker-ce-desktop-mac
        
Run below command from root directory of brandedtoken.js to run tests

```bash
    npm run test
    
```      

###### Initialize the chain on developer machine

After installing geth in above step, you should start the geth.


#### Creating an BrandedToken object

```js
// Creating brandedtoken.js object
const BrandedToken = require('./index.js');
const Setup = BrandedToken.EconomySetup;

```

###### Sample constants

You can set below constants to other addresses and data that you may prefer.
Please remember to use only addresses that you are able to access

```js

// Initialize web3 object using the geth endpoint
const web3Provider = 'http://127.0.0.1:8545';

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
const gas = 8000000;

```

###### ABI and BIN provider

brandedtoken.js comes with an in-built abi-bin provider for managing abi(s) and bin (s).

The abiBinProvider provides developers with following abi(s) and bin(s):

* [MockToken](brandedtoken-contracts RC url Amulya TBD) (an EIP20 contract with name 'MockToken')
* [BrandedToken](brandedtoken-contracts RC url Amulya TBD) (BrandedToken contract deployed on ValueChain)
* [UtilityBrandedToken](brandedtoken-contracts RC url Amulya TBD) (UtilityBrandedToken contract deployed on UtilityChain)
* [GatewayComposer](brandedtoken-contracts RC Amulya url) (GatewayComposer contract deployed on ValueChain per staker)
 
```js

// Get the MockToken ABI
let abiBinProvider = openST.abiBinProvider();
const mockTokenAbi = abiBinProvider.getABI('BrandedToken');

``` 


#### Deployment of contracts

For BrandedToken staking through GatewayComposer, you will want an EIP20 contract. You can 
either use a pre-deployed EIP20 contract or deploy a new one as shown below (presently only deploys a new MockToken contract).

##### Deploy EIP20Token contract(TBD)


##### Deploy Organization contract

An organization contract needs to be deployed per economy. You can follow below steps for deploying Organization contract.

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
organizationHelperObject.setup(organizationConfig, deployParams).then(function(){
    organizationAddress = organizationHelperObject.address;
});


```   

##### Deploy EIP20Token Mock contract
```js
let eip20Token;
const MockContractsDeployer = require('./test/utils/MockContractsDeployer');
const mockContractDeployerObject = new MockContractsDeployer(deployerAddress, web3Provider);
mockContractDeployerObject.deployMockToken().then(function(){
      eip20Token = mockContractDeployerObject.addresses.MockToken;
});

``` 

##### Deploy BrandedToken contract

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
```js
const mockContractDeployerObject = new MockContractsDeployer(deployerAddress, web3Provider);
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

```js
// StakeRequest nonce stored in BrandedToken contract.
let stakeRequestNonce;
// 1. Create TypedData
const stakeRequestTypedData = stakeHelperInstance.getStakeRequestTypedData(stakeAmountInWei, stakeRequestNonce);

// 2. Generate EIP712 signature object.
const workerAccountInstance = web3Provider.eth.accounts.wallet[worker];
workerAccountInstance.signEIP712TypedData(stakeRequestTypedData).then(function(result){
  signature = result;
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