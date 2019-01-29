'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../../index');

const Setup = Package.EconomySetup,
  OrganizationHelper = Setup.OrganizationHelper,
  UBTHelper = Setup.UtilityBrandedTokenHelper,
  assert = chai.assert,
  config = require('../../utils/configReader'),
  Contracts = require('../../../lib/Contracts'),
  KeepAliveConfig = require('../../utils/KeepAliveConfig');

const { dockerSetup, dockerTeardown } = require('../../utils/docker');

let web3, worker;

//Contract Address. TBD: Do not forget to set caUBT = null below.
//ca stands for contract address.
let caUBT = null;
let caOrganization = null;

let validateReceipt = (receipt) => {
  assert.isNotNull(receipt, 'Transaction Receipt is null');
  assert.isObject(receipt, 'Transaction Receipt is not an object');
  assert.isTrue(receipt.status, 'Transaction failed.');
  return receipt;
};

let validateDeploymentReceipt = (receipt) => {
  validateReceipt(receipt);
  let contractAddress = receipt.contractAddress;
  assert.isNotEmpty(contractAddress, 'Deployment Receipt is missing contractAddress');
  assert.isTrue(web3.utils.isAddress(contractAddress), 'Invalid contractAddress in Receipt');
  return receipt;
};

const valueTokenTestAddress = '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca';

describe('tests/helpers/UBTHelper', function() {
  let accountsOrigin;
  let deployerAddress;
  let deployParams;

  let helper = new UBTHelper(web3, caUBT);

  before(async function() {
    // Set up docker geth instance and retrieve RPC endpoint
    const { rpcEndpointOrigin } = await dockerSetup();
    web3 = new Web3(rpcEndpointOrigin);
    accountsOrigin = await web3.eth.getAccounts();
    deployerAddress = accountsOrigin[0];
    deployParams = {
      from: deployerAddress,
      gasPrice: config.gasPrice
    };

    if (!caOrganization) {
      console.log('* Setting up Organization');
      worker = accountsOrigin[1];

      let orgHelper = new OrganizationHelper(web3, caOrganization);

      const orgConfig = {
        deployer: deployerAddress,
        owner: deployerAddress,
        workers: worker
      };
      return orgHelper.setup(orgConfig).then(function() {
        caOrganization = orgHelper.address;
      });
    }
  });

  if (!caUBT) {
    it('should deploy new UtilityBrandedToken contract', function() {
      this.timeout(60000);
      return helper
        .deploy(valueTokenTestAddress, 'TBT', 'Test', 10, caOrganization, deployParams, web3)
        .then(validateDeploymentReceipt)
        .then((receipt) => {
          caUBT = receipt.contractAddress;
        });
    });
  }

  // Test Setup
  it('should setup UtilityBrandedToken', function() {
    this.timeout(60000);
    const ubtConfig = {
      deployer: deployerAddress,
      token: valueTokenTestAddress,
      symbol: 'BT',
      name: 'MyBrandedToken',
      decimals: '18',
      organization: caOrganization
    };
    return helper.setup(ubtConfig, deployParams, web3);
  });

  it('Should register internal actor', async function() {
    this.timeout(60000);
    const ubtConfig = {
      deployer: deployerAddress,
      token: valueTokenTestAddress,
      symbol: 'BT',
      name: 'MyBrandedToken',
      decimals: '18',
      organization: caOrganization
    };
    let options = {
      from: worker,
      gasPrice: config.gasPrice,
      gas: '60000'
    };

    let contractInstance = new Contracts(web3, web3);
    const ubtInstance = contractInstance.UtilityBrandedToken(caUBT, options);
    let internalActors = [accountsOrigin[2]];

    let tx = ubtInstance.methods.registerInternalActor(internalActors);

    let txReceipt;
    console.log(`* registerInternalActor on UtilityBrandedToken`);

    let response = await tx
      .send(options)
      .on('transactionHash', function(transaction) {
        console.log('\t - transaction hash:', transaction);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(txReceipt), '\x1b[0m\n');
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });

    // Verifying registered internal actor.
    assert.strictEqual(internalActors[0], response.events.InternalActorRegistered.returnValues['_actor']);
  });
});

KeepAliveConfig.get();
