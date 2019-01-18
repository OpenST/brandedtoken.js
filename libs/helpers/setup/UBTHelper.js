'use strict';

const AbiBinProvider = require('../../AbiBinProvider');

const ContractName = 'UtilityBrandedToken';
const DEFAULT_DECIMALS = 18;

/**
 * Helper method which performs deployment and setup related with Utility
 * Branded Token contract.
 */
class UBTHelper {
  constructor(web3, address) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Does setup of UtilityBrandedToken contract.
   *
   * @param config - Configuration object.
   *        {
   *          deployer: config.deployerAddress,
   *          token: brandedTokenContractAddress,
   *          symbol: "BT",
   *          name: "MyBrandedToken",
   *          decimals: "18",
   *          organization: '0x...'
   *        }
   * @param txOptions - Transaction object.
   * @param web3 - Web3 object.
   * @returns {Promise} - Promise object.
   */
  setup(config, txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;

    if (!config.token) {
      throw new Error('Mandatory configuration "token" missing. Set config.token address');
    }

    if (!config.organization) {
      throw new Error('Mandatory configuration "organization" missing. Set config.organization address.');
    }

    UBTHelper.validateSetupConfig(config);

    if (!txOptions) {
      txOptions = txOptions || {};
    }
    txOptions.gasPrice = 0;

    let deployParams = Object.assign({}, txOptions);
    deployParams.from = config.deployer;
    deployParams.gasPrice = 0;

    let promiseChain = oThis.deploy(
      config.token,
      config.symbol,
      config.name,
      config.decimals,
      config.organization,
      deployParams
    );

    return promiseChain;
  }

  /**
   * Performs deployment of UtilityBrandedToken contract.
   *
   * @param _token - Address of branded token on origin chain.
   *        It acts as an identifier.
   * @param _symbol - Symbol of the token.
   * @param _name - Name of the token.
   * @param _decimals - Decimal places of the token.
   * @param _organization - Address of the Organization contract.
   * @param txOptions - Tx options.
   * @param web3 - Web3 object.
   * @returns {PromiseLike<T> | Promise<T>} - Promise object.
   */
  deploy(_token, _symbol, _name, _decimals, _organization, txOptions, web3) {
    const oThis = this;

    web3 = web3 || oThis.web3;
    _decimals = _decimals || DEFAULT_DECIMALS;

    let tx = oThis._deployRawTx(_token, _symbol, _name, _decimals, _organization, txOptions, web3);

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

  /**
   * Returns raw Tx object for deployment.
   *
   * @param _token - Address of branded token on origin chain.
   *        It acts as an identifier.
   * @param _symbol - Symbol of the token.
   * @param _name - Name of the token.
   * @param _decimals - Decimal places of the token.
   * @param _organization - Address of the Organization contract.
   * @param txOptions - Tx options.
   * @param web3 - Web3 object.
   * @returns {PromiseLike<T>|Promise<T>} - Promise object.
   * @private
   */
  _deployRawTx(_token, _symbol, _name, _decimals, _organization, txOptions, web3) {
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

    let args = [_token, _symbol, _name, _decimals, _organization];

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
   * Sets CoGateway contract address.
   * @param cogateway - CoGateway contract address.
   * @param txOptions - Tx options.
   * @param contractAddress - UtilityBrandedToken contract address.
   * @param web3 -  Web3 object.
   */
  setCoGateway(cogateway, txOptions, contractAddress, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    contractAddress = contractAddress || oThis.address;

    let tx = oThis._setCoGatewayRawTx(cogateway, txOptions, contractAddress, web3);

    console.log(`* setCoGateway on ${ContractName}`);
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
   * Returns raw TX for setCoGateway.
   *
   * @param cogateway - Set CoGateway contract address.
   * @param txOptions - Tx Options for flexibility.
   * @param contractAddress - UtilityBrandedToken contract address.
   * @param web3 - Web3 object
   * @private
   */
  _setCoGatewayRawTx(cogateway, txOptions, contractAddress, web3) {
    const oThis = this;

    let defaultOptions = {
      gas: '60000',
      gasPrice: '0x5B9ACA00'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const contract = new web3.eth.Contract(abi, contractAddress, txOptions);

    return contract.methods.setCoGateway(cogateway);
  }

  /**
   * Performs validation of configuration parameters.
   * @param config -  Configuration json.
   * @returns {boolean} - Rteurns true on successful validation.
   */
  static validateSetupConfig(config) {
    console.log(`* Validating ${ContractName} Setup Config.`);
    if (!config) {
      throw new Error('Mandatory parameter "config" missing. ');
    }

    if (!config.deployer) {
      throw new Error('Mandatory configuration "deployer" missing. Set config.deployer address');
    }

    if (!config.symbol) {
      throw new Error('Mandatory configuration "symbol" missing. Set config.symbol address');
    }

    if (!config.name) {
      throw new Error('Mandatory configuration "name" missing. Set config.name address');
    }

    if (!config.decimals) {
      config.decimals = DEFAULT_DECIMALS;
    }

    return true;
  }

  /**
   * @returns {number} - Default decimal precision.
   */
  static get DEFAULT_DECIMALS() {
    return DEFAULT_DECIMALS;
  }
}

module.exports = UBTHelper;
