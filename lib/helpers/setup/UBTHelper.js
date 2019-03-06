// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

'use strict';

const AbiBinProvider = require('../../AbiBinProvider');
const Utils = require('../../../utils/Utils');
const logger = require('../../../logger');

const ContractName = 'UtilityBrandedToken';
const DEFAULT_DECIMALS = 18;

/**
 * The class performs deployment and setup of UtilityBrandedToken
 * contract.
 */
class UBTHelper {
  /**
   * UBTHelper constructor.
   * @param auxiliaryWeb3 Auxiliary chain web3 object.
   * @param address UtilityBrandedToken contract address.
   */
  constructor(auxiliaryWeb3, address) {
    const oThis = this;
    oThis.auxiliaryWeb3 = auxiliaryWeb3;
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
   * @param auxiliaryWeb3 - Auxiliary chain web3 object.
   * @returns {Promise} - Promise object.
   */
  setup(config, txOptions, auxiliaryWeb3) {
    const oThis = this;
    const auxiliaryWeb3Object = auxiliaryWeb3 || oThis.auxiliaryWeb3;

    if (!config.token) {
      const message = 'Mandatory configuration "token" missing. Set config.token address';
      logger.error(message);
      throw new Error(message);
    }

    if (!config.organization) {
      const message = 'Mandatory configuration "organization" missing. Set config.organization address.';
      logger.error(message);
      throw new Error(message);
    }

    UBTHelper.validateSetupConfig(config);

    let finalTxOptions;
    if (!txOptions) {
      finalTxOptions = txOptions || {};
    }

    const deployParams = Object.assign({}, finalTxOptions);
    deployParams.from = config.deployer;

    const promiseChain = oThis.deploy(
      config.token,
      config.symbol,
      config.name,
      config.decimals,
      config.organization,
      deployParams,
      auxiliaryWeb3Object,
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
   * @param auxiliaryWeb3 - Auxiliary chain web3 object.
   * @returns {PromiseLike<T> | Promise<T>} - Promise object.
   */
  deploy(_token, _symbol, _name, _decimals, _organization, txOptions, auxiliaryWeb3) {
    const oThis = this;

    const auxiliaryWeb3Object = auxiliaryWeb3 || oThis.auxiliaryWeb3;
    const decimalPlaces = _decimals || DEFAULT_DECIMALS;

    const tx = oThis._deployRawTx(
      _token,
      _symbol,
      _name,
      decimalPlaces,
      _organization,
      txOptions,
      auxiliaryWeb3Object,
    );

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      oThis.address = txReceipt.contractAddress;
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
   * @param auxiliaryWeb3 - Auxiliary chain web3 object.
   * @returns {PromiseLike<T>|Promise<T>} - Promise object.
   * @private
   */
  _deployRawTx(_token, _symbol, _name, _decimals, _organization, txOptions, auxiliaryWeb3) {
    const oThis = this;

    const { abiBinProvider } = oThis;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getBIN(ContractName);

    const defaultOptions = {};
    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    const finalTxOptions = defaultOptions;

    const args = [_token, _symbol, _name, _decimals, _organization];

    const contract = new auxiliaryWeb3.eth.Contract(abi, null, finalTxOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: args,
      },
      finalTxOptions,
    );
  }

  /**
   * Sets CoGateway contract address.
   * @param cogateway - CoGateway contract address.
   * @param txOptions - Tx options.
   * @param contractAddress - UtilityBrandedToken contract address.
   * @param auxiliaryWeb3 - Auxiliary chain web3 object.
   */
  setCoGateway(cogateway, txOptions, contractAddress, auxiliaryWeb3) {
    const oThis = this;
    const auxiliaryWeb3Object = auxiliaryWeb3 || oThis.auxiliaryWeb3;
    const ubtContractAddress = contractAddress || oThis.address;

    const tx = oThis._setCoGatewayRawTx(
      cogateway,
      txOptions,
      ubtContractAddress,
      auxiliaryWeb3Object,
    );

    return Utils.sendTransaction(tx, txOptions);
  }

  /**
   * Returns raw TX for setCoGateway.
   *
   * @param cogateway - Set CoGateway contract address.
   * @param txOptions - Tx Options for flexibility.
   * @param contractAddress - UtilityBrandedToken contract address.
   * @param auxiliaryWeb3 - Auxiliary chain web3 object.
   * @private
   */
  _setCoGatewayRawTx(cogateway, txOptions, contractAddress, auxiliaryWeb3) {
    const oThis = this;

    const defaultOptions = {};
    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    const finalTxOptions = defaultOptions;

    const { abiBinProvider } = oThis;
    const abi = abiBinProvider.getABI(ContractName);
    const contract = new auxiliaryWeb3.eth.Contract(abi, contractAddress, finalTxOptions);

    return contract.methods.setCoGateway(cogateway);
  }

  /**
   * Performs validation of configuration parameters.
   * @param config -  Configuration json.
   * @returns {boolean} - Returns true on successful validation.
   */
  static validateSetupConfig(config) {
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

    /* eslint no-param-reassign: "off" */
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
