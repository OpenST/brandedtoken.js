'use strict';

const Web3 = require('web3');
const BN = require('bn.js');
const AbiBinProvider = require('../../libs/AbiBinProvider');

const ContractName = 'BrandedToken';
const DEFAULT_DECIMALS = 18;
const DEFAULT_CONVERSION_RATE_DECIMALS = 5;

class BTHelper {
  constructor(web3, address) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /*
  //Supported Configurations for setup
  {
    deployer: config.deployerAddress,
    valueToken: config.simpleTokenContractAddress,
    symbol: "BT"
    name: "MyBrandedToken"
    decimals: "18"
    conversionRate: 
    conversionRateDecimals: 
    organization: 
  }
  All configurations are mandatory.
*/

  setup(config, txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;

    if (!config.organization) {
      throw new Error('Mandatory configuration "organization" missing. Set config.organization address.');
    }

    BTHelper.validateSetupConfig(config);

    if (!txOptions) {
      txOptions = txOptions || {};
    }
    txOptions.gasPrice = 0;

    let deployParams = Object.assign({}, txOptions);
    deployParams.from = config.deployer;
    deployParams.gasPrice = 0;

    let valueToken, symbol, name, decimals, conversionRate, conversionRateDecimals, organization;
    valueToken = config.valueToken;
    symbol = config.symbol;
    name = config.name;
    decimals = config.decimals;
    conversionRate = config.conversionRate;
    conversionRateDecimals = config.conversionRateDecimals;
    organization = config.organization;

    //1. Deploy the Contract
    let promiseChain = oThis.deploy(
      valueToken,
      symbol,
      name,
      decimals,
      conversionRate,
      conversionRateDecimals,
      organization,
      deployParams
    );

    return promiseChain;
  }

  static validateSetupConfig(config) {
    console.log(`* Validating ${ContractName} Setup Config.`);
    if (!config) {
      throw new Error('Mandatory parameter "config" missing. ');
    }

    if (!config.deployer) {
      throw new Error('Mandatory configuration "deployer" missing. Set config.deployer address');
    }

    //valueToken
    if (!config.valueToken) {
      throw new Error('Mandatory configuration "valueToken" missing. Set config.valueToken address');
    }

    //symbol
    if (!config.symbol) {
      throw new Error('Mandatory configuration "symbol" missing. Set config.symbol address');
    }

    //symbol
    if (!config.name) {
      throw new Error('Mandatory configuration "name" missing. Set config.name address');
    }

    //conversionRate
    if (!config.conversionRate) {
      throw new Error('Mandatory configuration "conversionRate" missing. Set config.conversionRate address');
    }

    //decimals
    if (!config.decimals) {
      config.decimals = DEFAULT_DECIMALS;
    }

    //conversionRateDecimals
    if (!config.decimals) {
      config.decimals = DEFAULT_CONVERSION_RATE_DECIMALS;
    }

    return true;
  }

  deploy(valueToken, symbol, name, decimals, conversionRate, conversionRateDecimals, organization, txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    decimals = decimals || DEFAULT_DECIMALS;
    conversionRateDecimals = conversionRateDecimals || DEFAULT_DECIMALS;

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

    let args = [valueToken, symbol, name, decimals, conversionRate, conversionRateDecimals, organization];

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
      .then(function(instace) {
        oThis.address = instace.options.address;
        console.log(`\t - ${ContractName} Contract Address:`, oThis.address);
        return txReceipt;
      });
  }

  static get DEFAULT_DECIMALS() {
    return DEFAULT_DECIMALS;
  }

  static get DEFAULT_CONVERSION_RATE_DECIMALS() {
    return DEFAULT_CONVERSION_RATE_DECIMALS;
  }
}

module.exports = BTHelper;
