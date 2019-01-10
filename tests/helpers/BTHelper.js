'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../index');

const Setup = Package.EconomySetup,
  OrganizationHelper = Setup.OrganizationHelper,
  BTHelper = Setup.BrandedTokenHelper,
  assert = chai.assert;

const config = require('../../tests/utils/configReader'),
  Web3WalletHelper = require('../../tests/utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

//Contract Address. TBD: Do not forget to set caBT = null below.
//ca stands for contract address.
let caBT = null;
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

const fName = 'BTHelper';
const SimpleTokenAddress = '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca';

describe('tests/helpers/BTHelper', function() {
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  let helper = new BTHelper(web3, caBT);

  before(function() {
    this.timeout(3 * 60000);
    //This hook could take long time.
    return web3WalletHelper.init(web3).then(function(_out) {
      if (!caOrganization) {
        console.log('* Setting up Organization');
        let orgHelper = new OrganizationHelper(web3, caOrganization);
        const orgConfig = {
          deployer: config.deployerAddress,
          owner: config.deployerAddress,
          workers: [config.facilitatorAddress]
        };
        return orgHelper.setup(orgConfig).then(function() {
          caOrganization = orgHelper.address;
        });
      }
      return _out;
    });
  });

  if (!caBT) {
    it('should deploy new BrandedToken contract', function() {
      this.timeout(60000);
      return helper
        .deploy(SimpleTokenAddress, 'TBT', 'Test', 10, 1, 0, caOrganization, deployParams)
        .then(validateDeploymentReceipt)
        .then((receipt) => {
          caBT = receipt.contractAddress;
        });
    });
  }

  //Test Setup
  it('should setup BrandedToken', function() {
    this.timeout(60000);
    const helperConfig = {
      deployer: config.deployerAddress,
      valueToken: SimpleTokenAddress,
      symbol: 'BT',
      name: 'MyBrandedToken',
      decimals: '18',
      conversionRate: '1000',
      conversionRateDecimals: 5,
      organization: caOrganization
    };
    return helper.setup(helperConfig, deployParams);
  });

  it('should lift restrictions', function() {
    this.timeout(60000);
    return helper
      .liftRestriction([caOrganization, config.deployerAddress], config.facilitatorAddress)
      .then(validateReceipt);
  });
});

// Go easy on RPC Client (Geth)
(function() {
  let maxHttpScokets = 10;
  let httpModule = require('http');
  httpModule.globalAgent.keepAlive = true;
  httpModule.globalAgent.keepAliveMsecs = 30 * 60 * 1000;
  httpModule.globalAgent.maxSockets = maxHttpScokets;
})();
