'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../index');

const Setup = Package.EconomySetup,
  GCHelper = Setup.GatewayComposerHelper,
  BTHelper = Setup.BrandedTokenHelper,
  assert = chai.assert;

const config = require('../../tests/utils/configReader'),
  Web3WalletHelper = require('../../tests/utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

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
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  let gcHelper = new GCHelper(web3, caGC);
  let btHelper = new BTHelper(web3, caGC);

  before(function() {
    this.timeout(3 * 60000);
    // This hook could take long time.
    return web3WalletHelper.init(web3);
  });

  it('should deploy new BrandedToken contract', function() {
    this.timeout(3 * 60000);
    return btHelper
      .deploy(valueTokenTestAddress, 'BT', 'MyBrandedToken', 18, 1000, 5, caOrganization, deployParams)
      .then(validateDeploymentReceipt)
      .then((receipt) => {
        brandedTokenTestAddress = receipt.contractAddress;
      });
  });

  if (!caGC) {
    it('should deploy new GatewayComposer contract', function() {
      this.timeout(3 * 60000);
      return gcHelper
        .deploy(ownerTestAddress, valueTokenTestAddress, brandedTokenTestAddress, deployParams)
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
      deployer: config.deployerAddress,
      valueToken: valueTokenTestAddress,
      brandedToken: brandedTokenTestAddress,
      owner: ownerTestAddress
    };
    return gcHelper.setup(helperConfig, deployParams);
  });
});

// TODO Refactor to common method
// Go easy on RPC Client (Geth)
(function() {
  let maxHttpScokets = 10;
  let httpModule = require('http');
  httpModule.globalAgent.keepAlive = true;
  httpModule.globalAgent.keepAliveMsecs = 30 * 60 * 1000;
  httpModule.globalAgent.maxSockets = maxHttpScokets;
})();
