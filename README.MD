BrandedToken.js
============
Description <TBD>

#### Overview of different components:

1. BrandedToken contract: Description <TBD>

2. GatewayComposer contract: Description <TBD>

3. UtilityBrandedToken contract: Description <TBD>

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

* [MockToken](brandedtoken-contracts RC url TBD) (an EIP20 contract with name 'MockToken')
* [BrandedToken](brandedtoken-contracts RC url TBD) (BrandedToken contract deployed on ValueChain)
* [UtilityBrandedToken](brandedtoken-contracts RC url TBD) (UtilityBrandedToken contract deployed on UtilityChain)
* [GatewayComposer](brandedtoken-contracts RC url) (GatewayComposer contract deployed on ValueChain per staker)
 

```js

// Get the MockToken ABI
let abiBinProvider = openST.abiBinProvider();
let mockTokenAbi = abiBinProvider.getABI('MockToken');

``` 

###### OpenST Deployer

OpenST.js comes with a Deployer class that can deploy MockToken, TokenRules, TransferRule, and TokenHolder contracts.

```js
let deployerParams = {
  "from": deployerAddress,
  "gasPrice": gasPrice,
  "gas": gas
};
let deployer = new openST.Deployer( deployerParams );
```

#### Deployment of contracts

For BrandedToken staking through GatewayComposer, you will want an EIP20 contract. You can 
either use a pre-deployed EIP20 contract or deploy a new one as shown below (presently only deploys a new MockToken contract).

```js
// Deploy EIP20 
// if needed (not mandatory)
let eip20Address = null;
deployer.deployEIP20Token().then(function( receipt ){
  eip20Address = receipt.contractAddress;
  console.log('eip20Address noted down:', eip20Address);
});

```

An organization contract needs to be deployed per economy. You can follow below steps for deploying organization contract.

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
organizationHelperObject.setup(organizationConfig).then(function(){
    organizationAddress = organizationHelperObject.address;
});


```           