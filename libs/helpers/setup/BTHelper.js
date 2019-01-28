'use strict';

const AbiBinProvider = require('../../AbiBinProvider');
const Contracts = require('../../Contracts');

const ContractName = 'BrandedToken';
const DEFAULT_DECIMALS = 18;
const DEFAULT_CONVERSION_RATE_DECIMALS = 5;

/**
 *  BTHelper has setup and deployment methods for BT contract.
 */
class BTHelper {
  /**
   * @param web3 - web3 instance object
   * @param address - BrandedToken contract address
   */
  constructor(web3, address) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * @param config - Supported configigurations
   *                  {
   *                    deployer: config.deployerAddress,
   *                    valueToken: config.simpleTokenContractAddress,
   *                    symbol: "BT"
   *                    name: "MyBrandedToken"
   *                    decimals: "18"
   *                    conversionRate:
   *                    conversionRateDecimals:
   *                    organization:
   *                  }
   * @param txOptions - More options for flexibility.
   * @param web3 - web3 object.
   * @returns {Promise} - Promise object.
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

  /**
   * @param config - configuration parameters.
   * @returns {boolean} - True on successful validation.
   */
  static validateSetupConfig(config) {
    console.log(`* Validating ${ContractName} Setup Config.`);
    if (!config) {
      throw new Error('Mandatory parameter "config" missing. ');
    }

    if (!config.deployer) {
      throw new Error('Mandatory configuration "deployer" missing. Set config.deployer address');
    }

    if (!config.valueToken) {
      throw new Error('Mandatory configuration "valueToken" missing. Set config.valueToken address');
    }

    if (!config.symbol) {
      throw new Error('Mandatory configuration "symbol" missing. Set config.symbol address');
    }

    if (!config.name) {
      throw new Error('Mandatory configuration "name" missing. Set config.name address');
    }

    if (!config.conversionRate) {
      throw new Error('Mandatory configuration "conversionRate" missing. Set config.conversionRate address');
    }

    if (!config.decimals) {
      config.decimals = DEFAULT_DECIMALS;
    }

    if (!config.decimals) {
      config.decimals = DEFAULT_CONVERSION_RATE_DECIMALS;
    }

    return true;
  }

  /**
   * @param valueToken - ValueToken address on value chain. e.g. OST
   * @param symbol - The value to which tokenSymbol, defined in EIP20Token,
   *                is set.
   * @param name - The value to which tokenName, defined in EIP20Token,
   *              is set.
   * @param decimals - The value to which tokenDecimals, defined in EIP20Token,
   *                  is set.
   * @param conversionRate - The value to which conversionRate is set.
   * @param conversionRateDecimals - The value to which
   *                                conversionRateDecimals is set.
   * @param organization - Organization contract address.
   * @param txOptions - transaction options
   * @param web3 - Web3 object.
   * @returns {PromiseLike<T> | Promise<T>} - Promise object.
   */
  deploy(valueToken, symbol, name, decimals, conversionRate, conversionRateDecimals, organization, txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    decimals = decimals || DEFAULT_DECIMALS;
    conversionRateDecimals = conversionRateDecimals || DEFAULT_DECIMALS;

    let tx = oThis._deployRawTx(
      valueToken,
      symbol,
      name,
      decimals,
      conversionRate,
      conversionRateDecimals,
      organization,
      txOptions,
      web3
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

  /**
   * @param valueToken - The value to which valueToken is set.
   * @param symbol - The value to which tokenSymbol, defined in EIP20Token,
   *                is set.
   * @param name - The value to which tokenName, defined in EIP20Token,
   *              is set.
   * @param decimals - The value to which tokenDecimals, defined in EIP20Token,
   *                  is set.
   * @param conversionRate - The value to which conversionRate is set.
   * @param conversionRateDecimals - The value to which
   *                                conversionRateDecimals is set.
   * @param organization - Organization contract address.
   * @param txOptions - transaction options for flexibility.
   * @param web3 - Web3 object.
   * @returns {PromiseLike<T>|Promise<T>|*} - Promise obhect
   * @private
   */
  _deployRawTx(
    valueToken,
    symbol,
    name,
    decimals,
    conversionRate,
    conversionRateDecimals,
    organization,
    txOptions,
    web3
  ) {
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

    let args = [valueToken, symbol, name, decimals, conversionRate, conversionRateDecimals, organization];

    const contract = new web3.eth.Contract(abi, null, txOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );
  }

  /**
   * @param gateway - Gateway contract address.
   * @param organizationWorker - Organization worker address.
   * @param txOptions - Transaction options.
   * @param contractAddress - Branded Token contract address.
   * @param web3 - Web3 object
   * @returns {PromiseLike<T> | Promise<T>} - Promise object.
   */
  setGateway(gateway, organizationWorker, txOptions, contractAddress, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    contractAddress = contractAddress || oThis.address;

    let gatewayContract = Contracts.getEIP20Gateway(web3, gateway);

    console.log(`* Fetching simpleStake Address`);
    return gatewayContract.methods
      .stakeVault()
      .call()
      .then(function(stakeVault) {
        console.log('\t - stakeVault', stakeVault);
        return oThis.liftRestriction([gateway, stakeVault], organizationWorker, txOptions, contractAddress, web3);
      });
  }

  /**
   * @param addresses - Addresses to be unrestricted.
   * @param organizationWorker - Organization worker address.
   * @param txOptions - Transaction options.
   * @param contractAddress - Branded Token contract address.
   * @param web3 - Web3 object.
   */
  liftRestriction(addresses, organizationWorker, txOptions, contractAddress, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    contractAddress = contractAddress || oThis.address;

    let tx = oThis._liftRestrictionRawTx(addresses, organizationWorker, txOptions, contractAddress, web3);

    console.log(`* liftRestriction for [${addresses.join(',')}] on ${ContractName}`);
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }

  /**
   * @param addresses - Addresses to be unrestricted.
   * @param organizationWorker - Organization worker address.
   * @param txOptions - Transaction options.
   * @param contractAddress - Branded token contract address.
   * @param web3 - Web3 object.
   * @private
   */
  _liftRestrictionRawTx(addresses, organizationWorker, txOptions, contractAddress, web3) {
    const oThis = this;

    let defaultOptions = {
      from: organizationWorker,
      gas: '100000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    if (typeof addresses === 'string') {
      addresses = [addresses];
    }

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const contract = new web3.eth.Contract(abi, contractAddress, txOptions);

    return contract.methods.liftRestriction(addresses);
  }

  static get DEFAULT_DECIMALS() {
    return DEFAULT_DECIMALS;
  }

  static get DEFAULT_CONVERSION_RATE_DECIMALS() {
    return DEFAULT_CONVERSION_RATE_DECIMALS;
  }
}

module.exports = BTHelper;
