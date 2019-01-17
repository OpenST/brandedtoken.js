'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../index');

const Setup = Package.EconomySetup,
  GCHelper = Setup.GatewayComposerHelper,
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

const valueTokenTestAddress = '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aecb';
const ownerTestAddress = '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aecc';
const brandedTokenTestAddress = '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aecd';

describe('tests/helpers/GCHelper', function() {
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  let helper = new GCHelper(web3, caGC);

  before(function() {
    this.timeout(3 * 60000);
    // This hook could take long time.
    return web3WalletHelper.init(web3);
  });

  if (!caGC) {
    it('should deploy new GatewayComposer contract', function() {
      this.timeout(60000);
      return helper
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
    return helper.setup(helperConfig, deployParams);
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
