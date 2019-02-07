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
      throw new Error('Mandatory configuration "organization" missing. Set config.organization address.');
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

    console.log(`* Deploying ${ContractName} Contract`);
    let txReceipt;
    return tx
      .send(txOptions)
      .on('transactionHash', (transactionHash) => {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('error', (error) => {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      })
      .on('receipt', (receipt) => {
        txReceipt = receipt;
      })
      .then((instance) => {
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

    const defaultOptions = {
      gas: '7500000',
    };

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

    return tx
      .send(txOptions)
      .on('transactionHash', (transactionHash) => {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('error', (error) => {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
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
      gas: '100000',
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
