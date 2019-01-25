'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../index');

const Setup = Package.EconomySetup,
  OrganizationHelper = Setup.OrganizationHelper,
  BTHelper = Setup.BrandedTokenHelper,
  assert = chai.assert;

const config = require('./../utils/configReader'),
  Web3WalletHelper = require('./../utils/Web3WalletHelper'),
  KeepAliveConfig = require('./../utils/KeepAliveConfig');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

// Do not forget to set caBT = null below.
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

const valueTokenTestAddress = '0x1610A6b7656E4A323ffeBfbC7E147F5A2ff9d423';

describe('tests/helpers/BTHelper', function() {
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  let helper = new BTHelper(web3, caBT);

  before(function() {
    this.timeout(3 * 60000);
    // This hook could take long time.
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
        .deploy(valueTokenTestAddress, 'BT', 'MyBrandedToken', 18, 1000, 5, caOrganization, deployParams)
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
      valueToken: valueTokenTestAddress,
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

KeepAliveConfig.get();
