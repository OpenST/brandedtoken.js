'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../../index');

const Setup = Package.EconomySetup,
  OrganizationHelper = Setup.OrganizationHelper,
  BTHelper = Setup.BrandedTokenHelper,
  assert = chai.assert;

const { dockerSetup, dockerTeardown } = require('../../utils/docker');

const config = require('../../utils/configReader'),
  KeepAliveConfig = require('../../utils/KeepAliveConfig');

let web3;

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
  let deployerAddress;
  let facilitatorAddress;
  let deployParams;

  let helper = new BTHelper(web3, caBT);

  before(async function() {
    // Set up docker geth instance and retrieve RPC endpoint
    const { rpcEndpointOrigin } = await dockerSetup();
    web3 = new Web3(rpcEndpointOrigin);
    const accountsOrigin = await web3.eth.getAccounts();
    deployerAddress = accountsOrigin[0];
    facilitatorAddress = accountsOrigin[1];
    deployParams = {
      from: deployerAddress,
      gasPrice: config.gasPrice
    };

    if (!caOrganization) {
      console.log('* Setting up Organization');
      let orgHelper = new OrganizationHelper(web3, caOrganization);
      const orgConfig = {
        deployer: deployerAddress,
        owner: deployerAddress,
        workers: [facilitatorAddress]
      };
      return orgHelper.setup(orgConfig).then(function() {
        caOrganization = orgHelper.address;
      });
    }
  });

  after(() => {
    dockerTeardown();
  });

  if (!caBT) {
    it('should deploy new BrandedToken contract', function() {
      this.timeout(60000);
      return helper
        .deploy(valueTokenTestAddress, 'BT', 'MyBrandedToken', 18, 1000, 5, caOrganization, deployParams, web3)
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
      deployer: deployerAddress,
      valueToken: valueTokenTestAddress,
      symbol: 'BT',
      name: 'MyBrandedToken',
      decimals: '18',
      conversionRate: '1000',
      conversionRateDecimals: 5,
      organization: caOrganization
    };
    return helper.setup(helperConfig, deployParams, web3);
  });

  it('should lift restrictions', function() {
    this.timeout(60000);
    return helper
      .liftRestriction([caOrganization, deployerAddress], facilitatorAddress, null, null, web3)
      .then(validateReceipt);
  });
});

KeepAliveConfig.get();
