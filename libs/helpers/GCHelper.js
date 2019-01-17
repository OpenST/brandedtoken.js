'use strict';

// TODO Do we need below non used variables
const Web3 = require('web3');
const BN = require('bn.js');
const AbiBinProvider = require('../../libs/AbiBinProvider');

const ContractName = 'GatewayComposer';

// TODO Documentation
class GCHelper {
  constructor(web3, address) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /*
     Configurations for setup
    {
      "deployer": config.deployerAddress,
      "owner": config.staker,
      "valueToken": config.simpleTokenContractAddress,
      "brandedToken": config.brandedTokenContractAddress,
    }
     All configurations are mandatory.
   */
  setup(config, txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;

    GCHelper.validateSetupConfig(config);

    if (!txOptions) {
      txOptions = txOptions || {};
    }
    txOptions.gasPrice = 0;

    let deployParams = Object.assign({}, txOptions);
    deployParams.from = config.deployer;
    deployParams.gasPrice = 0; // TODO why gasPrice is 0

    let owner, valueToken, brandedToken;
    owner = config.owner;
    valueToken = config.valueToken;
    brandedToken = config.brandedToken;

    // Deploy the Contract
    let promiseChain = oThis.deploy(owner, valueToken, brandedToken, deployParams);

    return promiseChain;
  }

  static validateSetupConfig(config) {
    console.log(`* Validating ${ContractName} Setup Config.`);
    if (!config) {
      throw new Error('Mandatory parameter "config" missing. ');
    }

    //owner/staker
    if (!config.owner) {
      throw new Error('Mandatory configuration "owner" missing. Set config.owner address');
    }

    //valueToken
    if (!config.valueToken) {
      throw new Error('Mandatory configuration "valueToken" missing. Set config.valueToken address');
    }

    //brandedToken
    if (!config.brandedToken) {
      throw new Error('Mandatory configuration "brandedToken" missing. Set config.brandedToken address');
    }

    return true;
  }

  deploy(owner, valueToken, brandedToken, txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getBIN(ContractName);

    // TODO refactor to constant
    let defaultOptions = {
      gas: '8000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    let args = [owner, valueToken, brandedToken];

    const contract = new web3.eth.Contract(abi, null, txOptions);
    let tx = contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );

    console.log(`* Deploying ${ContractName} Contract`);
    let txReceipt;
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      })
      .then(function(instance) {
        oThis.address = instance.options.address;
        console.log(`\t - ${ContractName} Contract Address:`, oThis.address);
        return txReceipt;
      });
  }
}

module.exports = GCHelper;
