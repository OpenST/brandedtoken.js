'use strict';

const Web3 = require('web3');
const BN = require('bn.js');
const AbiBinProvider = require('../../libs/AbiBinProvider');

const ContractName = 'GatewayComposer';
const DEFAULT_DECIMALS = 18;
const DEFAULT_CONVERSION_RATE_DECIMALS = 5;

class GCHelper {
  constructor(web3, address) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /*
  //Supported Configurations for setup
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
    deployParams.gasPrice = 0;

    //1. Deploy the Contract
    let promiseChain = oThis.deploy(simpleToken, config.organization, deployParams);

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

    let tx = oThis._deployRawTx(owner, valueToken, brandedToken, txOptions, web3);

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
      .then(function(instace) {
        oThis.address = instace.options.address;
        console.log(`\t - ${ContractName} Contract Address:`, oThis.address);
        return txReceipt;
      });
  }

  _deployRawTx(owner, valueToken, brandedToken, txOptions, web3) {

    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getBIN(ContractName);

    let defaultOptions = {
      gas: '8000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    let args = [owner, valueToken, brandedToken];

    const contract = new web3.eth.Contract(abi, null, txOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );

  }

  static get DEFAULT_DECIMALS() {
    return DEFAULT_DECIMALS;
  }

  static get DEFAULT_CONVERSION_RATE_DECIMALS() {
    return DEFAULT_CONVERSION_RATE_DECIMALS;
  }
}

module.exports = GCHelper;
