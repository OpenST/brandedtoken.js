'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../index');

const Setup = Package.EconomySetup,
  OrganizationHelper = Setup.OrganizationHelper,
  BTHelper = Setup.BTHelper,
  assert = chai.assert;

const config = require('../../tests/utils/configReader'),
  Web3WalletHelper = require('../../tests/utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

//Contract Address. TBD: Do not forget to set caBT = null below.
//ca stands for contract address.
let caBT = null;
let caOrganization = '0x39e1a58d972d84188DB7f39a06FC56C5bec59c3d';

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
          owner: config.deployerAddress
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

  // //Initialize OSTPrime
  // it('should initialize OSTPrime', function() {
  //   this.timeout(60000);
  //   let ownerParams = Object.assign({}, deployParams);
  //   ownerParams.from = config.chainOwner;
  //   return helper.initialize(ownerParams).then(validateReceipt);
  // });

  // //Test Setup
  // it('should setup OSTPrime', function() {
  //   this.timeout(60000);
  //   const ostPrimeConfig = {
  //     deployer: config.deployerAddress,
  //     organization: caOrganization,
  //     chainOwner: chainOwner
  //   };
  //   return helper.setup(SimpleTokenAddress, ostPrimeConfig, deployParams);
  // });
});

// Go easy on RPC Client (Geth)
(function() {
  let maxHttpScokets = 10;
  let httpModule = require('http');
  httpModule.globalAgent.keepAlive = true;
  httpModule.globalAgent.keepAliveMsecs = 30 * 60 * 1000;
  httpModule.globalAgent.maxSockets = maxHttpScokets;
})();
