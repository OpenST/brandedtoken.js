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
const Contracts = require('../../Contracts');
const Utils = require('../../../utils/Utils');
const logger = require('../../../logger');

const ContractName = 'BrandedToken';
const DEFAULT_DECIMALS = 18;
const DEFAULT_CONVERSION_RATE_DECIMALS = 5;

/**
 *  BTHelper has setup and deployment methods for BT contract.
 */
class BTHelper {
  /**
   * BTHelper constructor.
   * @param originWeb3 - Origin chain web3 object.
   * @param address - BrandedToken contract address
   */
  constructor(originWeb3, address) {
    const oThis = this;
    oThis.originWeb3 = originWeb3;
    oThis.address = address;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * @param config - Supported configurations:
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
   * @param txOptions More options for flexibility.
   * @param originWeb3 Origin chain web3 object.
   * @returns {Promise} - Promise object.
   */
  setup(config, txOptions, originWeb3) {
    const oThis = this;
    const originWeb3Object = originWeb3 || oThis.originWeb3;

    if (!config.organization) {
      const message = 'Mandatory configuration "organization" missing. Set config.organization address.';
      logger.error(message);
      throw new Error(message);
    }

    BTHelper.validateSetupConfig(config);

    let finalTxOptions;
    if (!txOptions) {
      finalTxOptions = txOptions || {};
    }

    const deployParams = Object.assign({}, finalTxOptions);
    deployParams.from = config.deployer;

    const promiseChain = oThis.deploy(
      config.valueToken,
      config.symbol,
      config.name,
      config.decimals,
      config.conversionRate,
      config.conversionRateDecimals,
      config.organization,
      deployParams,
      originWeb3Object,
    );

    return promiseChain;
  }

  /**
   * @param config - configuration parameters.
   * @returns {boolean} - True on successful validation.
   */
  static validateSetupConfig(config) {
    if (!config) {
      const message = 'Mandatory parameter "config" missing. ';
      logger.error(message);
      throw new Error(message);
    }

    if (!config.deployer) {
      const message = 'Mandatory configuration "deployer" missing. Set config.deployer address';
      logger.error(message);
      throw new Error(message);
    }

    if (!config.valueToken) {
      const message = 'Mandatory configuration "valueToken" missing. Set config.valueToken address';
      logger.error(message);
      throw new Error(message);
    }

    if (!config.symbol) {
      const message = 'Mandatory configuration "symbol" missing. Set config.symbol address';
      logger.error(message);
      throw new Error(message);
    }

    if (!config.name) {
      const message = 'Mandatory configuration "name" missing. Set config.name address';
      logger.error(message);
      throw new Error(message);
    }

    if (!config.conversionRate) {
      const message = 'Mandatory configuration "conversionRate" missing. Set config.conversionRate address';
      logger.error(message);
      throw new Error(message);
    }

    /* eslint no-param-reassign: "off" */
    if (!config.decimals) {
      config.decimals = DEFAULT_DECIMALS;
    }

    /* eslint no-param-reassign: "off" */
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
   * @param originWeb3 - Origin chain web3 object.
   * @returns {PromiseLike<T> | Promise<T>} - Promise object.
   */
  deploy(
    valueToken,
    symbol,
    name,
    decimals,
    conversionRate,
    conversionRateDecimals,
    organization,
    txOptions,
    originWeb3,
  ) {
    const oThis = this;
    const originWeb3Object = originWeb3 || oThis.originWeb3;
    const decimalsValue = decimals || DEFAULT_DECIMALS;
    const conversionRateDecimalsValue = conversionRateDecimals || DEFAULT_DECIMALS;

    const tx = oThis._deployRawTx(
      valueToken,
      symbol,
      name,
      decimalsValue,
      conversionRate,
      conversionRateDecimalsValue,
      organization,
      txOptions,
      originWeb3Object,
    );

    logger.info(`* Deploying ${ContractName} Contract`);
    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      oThis.address = txReceipt.contractAddress;
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
   * @param originWeb3 - Origin chain web3 object.
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
    originWeb3,
  ) {
    const oThis = this;

    const { abiBinProvider } = oThis;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getBIN(ContractName);

    const defaultOptions = {};
    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    const finalTxOptions = defaultOptions;

    const args = [
      valueToken,
      symbol,
      name,
      decimals,
      conversionRate,
      conversionRateDecimals,
      organization,
    ];

    const contract = new originWeb3.eth.Contract(abi, null, finalTxOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: args,
      },
      finalTxOptions,
    );
  }

  /**
   * @param gateway - Gateway contract address.
   * @param organizationWorker - Organization worker address.
   * @param txOptions - Transaction options.
   * @param contractAddress - Branded Token contract address.
   * @param originWeb3 - Origin chain web3 object.
   * @returns {PromiseLike<T> | Promise<T>} - Promise object.
   */
  setGateway(gateway, organizationWorker, txOptions, contractAddress, originWeb3) {
    const oThis = this;
    const originWeb3Object = originWeb3 || oThis.originWeb3;
    const btContractAddress = contractAddress || oThis.address;

    const gatewayContract = Contracts.getEIP20Gateway(originWeb3Object, gateway);

    return gatewayContract.methods
      .stakeVault()
      .call()
      .then(stakeVault => oThis.liftRestriction(
        [gateway, stakeVault],
        organizationWorker,
        txOptions,
        btContractAddress,
        originWeb3Object,
      ));
  }

  /**
   * @param addresses - Addresses to be unrestricted.
   * @param organizationWorker - Organization worker address.
   * @param txOptions - Transaction options.
   * @param contractAddress - Branded Token contract address.
   * @param originWeb3 - Origin chain web3 object.
   */
  liftRestriction(addresses, organizationWorker, txOptions, contractAddress, originWeb3) {
    const oThis = this;
    const originWeb3Object = originWeb3 || oThis.originWeb3;
    const btContractAddress = contractAddress || oThis.address;

    const tx = oThis._liftRestrictionRawTx(
      addresses,
      organizationWorker,
      txOptions,
      btContractAddress,
      originWeb3Object,
    );

    return Utils.sendTransaction(tx, txOptions);
  }

  /**
   * @param addresses - Addresses to be unrestricted.
   * @param organizationWorker - Organization worker address.
   * @param txOptions - Transaction options.
   * @param contractAddress - Branded token contract address.
   * @param originWeb3 - Origin chain web3 object.
   * @private
   */
  _liftRestrictionRawTx(addresses, organizationWorker, txOptions, contractAddress, originWeb3) {
    const oThis = this;

    const defaultOptions = {
      from: organizationWorker,
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    const finalTxOptions = defaultOptions;

    let addressesArray;
    if (typeof addresses === 'string') {
      addressesArray = [addresses];
    } else {
      addressesArray = addresses;
    }

    const { abiBinProvider } = oThis;
    const abi = abiBinProvider.getABI(ContractName);
    const contract = new originWeb3.eth.Contract(abi, contractAddress, finalTxOptions);

    return contract.methods.liftRestriction(addressesArray);
  }

  static get DEFAULT_DECIMALS() {
    return DEFAULT_DECIMALS;
  }

  static get DEFAULT_CONVERSION_RATE_DECIMALS() {
    return DEFAULT_CONVERSION_RATE_DECIMALS;
  }
}

module.exports = BTHelper;
