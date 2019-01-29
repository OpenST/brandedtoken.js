'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../../index');

const Setup = Package.EconomySetup,
  GCHelper = Setup.GatewayComposerHelper,
  BTHelper = Setup.BrandedTokenHelper,
  assert = chai.assert;

const { dockerSetup, dockerTeardown } = require('../../utils/docker');

const config = require('../../utils/configReader'),
  KeepAliveConfig = require('../../utils/KeepAliveConfig');

let web3;

// Contract Address. TBD: Do not forget to set caGC = null below.
//ca stands for contract address.
let caGC = null;

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

const ownerTestAddress = '0x1610A6b7656E4A323ffeBfbC7E147F5A2ff9d423';
const valueTokenTestAddress = '0x1610A6b7656E4A323ffeBfbC7E147F5A2ff9d423';
const caOrganization = '0x1610A6b7656E4A323ffeBfbC7E147F5A2ff9d423';
let brandedTokenTestAddress;

describe('tests/helpers/GCHelper', function() {
  let deployerAddress;
  let deployParams;

  let gcHelper = new GCHelper(web3, caGC);
  let btHelper = new BTHelper(web3, caGC);

  before(async function() {
    // Set up docker geth instance and retrieve RPC endpoint
    const { rpcEndpointOrigin } = await dockerSetup();
    web3 = new Web3(rpcEndpointOrigin);
    const accountsOrigin = await web3.eth.getAccounts();
    deployerAddress = accountsOrigin[0];
    deployParams = {
      from: deployerAddress,
      gasPrice: config.gasPrice
    };
  });

  after(() => {
    dockerTeardown();
  });

  it('should deploy new BrandedToken contract', function() {
    this.timeout(3 * 60000);
    return btHelper
      .deploy(valueTokenTestAddress, 'BT', 'MyBrandedToken', 18, 1000, 5, caOrganization, deployParams, web3)
      .then(validateDeploymentReceipt)
      .then((receipt) => {
        brandedTokenTestAddress = receipt.contractAddress;
      });
  });

  if (!caGC) {
    it('should deploy new GatewayComposer contract', function() {
      this.timeout(3 * 60000);
      return gcHelper
        .deploy(ownerTestAddress, valueTokenTestAddress, brandedTokenTestAddress, deployParams, web3)
        .then(validateDeploymentReceipt)
        .then((receipt) => {
          caGC = receipt.contractAddress;
        });
    });
  }

  // Test Setup
  it('Should setup GatewayComposer', function() {
    this.timeout(60000);
    const helperConfig = {
      deployer: deployerAddress,
      valueToken: valueTokenTestAddress,
      brandedToken: brandedTokenTestAddress,
      owner: ownerTestAddress
    };
    return gcHelper.setup(helperConfig, deployParams, web3);
  });
});

KeepAliveConfig.get();
