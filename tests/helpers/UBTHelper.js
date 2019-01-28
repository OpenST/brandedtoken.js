'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../index');

const Setup = Package.EconomySetup,
  OrganizationHelper = Setup.OrganizationHelper,
  UBTHelper = Setup.UtilityBrandedTokenHelper,
  assert = chai.assert,
  config = require('../../tests/utils/configReader'),
  Web3WalletHelper = require('../../tests/utils/Web3WalletHelper'),
  Contracts = require('../../libs/Contracts'),
  KeepAliveConfig = require('../../tests/utils/KeepAliveConfig');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3),
  worker;

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
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  let helper = new UBTHelper(web3, caUBT);

  before(function() {
    this.timeout(3 * 60000);
    //This hook could take long time.
    return web3WalletHelper.init(web3).then(function(_out) {
      if (!caOrganization) {
        console.log('* Setting up Organization');
        const wallets = web3WalletHelper.web3Object.eth.accounts.wallet;
        worker = wallets[1].address;

        let orgHelper = new OrganizationHelper(web3, caOrganization);

        const orgConfig = {
          deployer: config.deployerAddress,
          owner: config.deployerAddress,
          workers: worker
        };
        return orgHelper.setup(orgConfig).then(function() {
          caOrganization = orgHelper.address;
        });
      }
      return _out;
    });
  });

  if (!caUBT) {
    it('should deploy new UtilityBrandedToken contract', function() {
      this.timeout(60000);
      return helper
        .deploy(valueTokenTestAddress, 'TBT', 'Test', 10, caOrganization, deployParams)
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
      deployer: config.deployerAddress,
      token: valueTokenTestAddress,
      symbol: 'BT',
      name: 'MyBrandedToken',
      decimals: '18',
      organization: caOrganization
    };
    return helper.setup(ubtConfig, deployParams);
  });

  it('Should register internal actor', async function() {
    this.timeout(60000);
    const ubtConfig = {
      deployer: config.deployerAddress,
      token: valueTokenTestAddress,
      symbol: 'BT',
      name: 'MyBrandedToken',
      decimals: '18',
      organization: caOrganization
    };
    let wallets = web3WalletHelper.web3Object.eth.accounts.wallet;
    let options = {
      from: worker,
      gasPrice: config.gasPrice,
      gas: '60000'
    };

    let contractInstance = new Contracts(web3, web3);
    const ubtInstance = contractInstance.UtilityBrandedToken(caUBT, options);
    let internalActors = [wallets[3].address];

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
