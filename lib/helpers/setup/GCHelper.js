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

const ContractName = 'GatewayComposer';

/**
 * Performs setup and deployment of GatewayComposer.
 */
class GCHelper {
  /**
   * GCHelper constructor.
   * @param originWeb3 - Origin chain web3 object.
   * @param address - GatewayComposer contract address.
   */
  constructor(originWeb3, address) {
    const oThis = this;
    oThis.originWeb3 = originWeb3;
    oThis.address = address;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * @param config - Configurations for setup:
   *                 {
   *                  "deployer": config.deployerAddress,
   *                  "owner": config.staker,
   *                  "valueToken": config.simpleTokenContractAddress,
   *                  "brandedToken": config.brandedTokenContractAddress,
   *                  }
   * @param txOptions - Tx options.
   * @param originWeb3 - Origin chain web3 object.
   * @returns {Promise} - Promise object.
   */
  setup(config, txOptions, originWeb3) {
    const oThis = this;
    const originWeb3Object = originWeb3 || oThis.originWeb3;

    GCHelper.validateSetupConfig(config);

    let txOptionsObject;
    if (!txOptions) {
      txOptionsObject = txOptions || {};
    }

    const deployParams = Object.assign({}, txOptionsObject);
    deployParams.from = config.deployer;

    // Deploy the Contract
    const promiseChain = oThis.deploy(
      config.owner,
      config.valueToken,
      config.brandedToken,
      deployParams,
      originWeb3Object,
    );

    return promiseChain;
  }

  /**
   * Performs validation of input methods.
   *
   * @param config - Configuration parameters.
   * @returns {boolean} - True on successful validation.
   */
  static validateSetupConfig(config) {
    if (!config) {
      throw new Error('Mandatory parameter "config" missing. ');
    }

    if (!config.owner) {
      throw new Error('Mandatory configuration "owner" missing. Set config.owner address');
    }

    if (!config.valueToken) {
      throw new Error('Mandatory configuration "valueToken" missing. Set config.valueToken address');
    }

    if (!config.brandedToken) {
      throw new Error('Mandatory configuration "brandedToken" missing. Set config.brandedToken address');
    }

    return true;
  }

  /**
   * Deploys Gateway Composer.
   * @param owner - Address of the staker on the value chain.
   * @param valueToken - EIP20Token address which is staked.
   * @param brandedToken - It's a value backed minted EIP20Token.
   * @param txOptions - Transaction options for flexibility.
   * @param originWeb3 - Origin chain web3 object.
   * @returns {PromiseLike<T> | Promise<T>} - Promise object.
   */
  deploy(owner, valueToken, brandedToken, txOptions, originWeb3) {
    const oThis = this;
    const originWeb3Object = originWeb3 || oThis.originWeb3;

    const tx = oThis._deployRawTx(owner, valueToken, brandedToken, txOptions, originWeb3Object);

    let txReceipt;
    return tx
      .send(txOptions)
      .on('transactionHash', (transactionHash) => {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('error', (error) => {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        /* eslint no-undef: "off" */
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
   * Returns raw transaction object.
   *
   * @param owner - Address of the staker on the value chain.
   * @param valueToken - EIP20Token address which is staked.
   * @param brandedToken - It's a value backed minted EIP20Token.
   * @param txOptions - Transaction options for flexibility.
   * @param originWeb3 - Origin chain web3 object.
   * @returns {PromiseLike<T>|Promise<T>|*} - Promise object.
   * @private
   */
  _deployRawTx(owner, valueToken, brandedToken, txOptions, originWeb3) {
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

    const args = [owner, valueToken, brandedToken];

    const contract = new originWeb3.eth.Contract(abi, null, finalTxOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: args,
      },
      finalTxOptions,
    );
  }
}

module.exports = GCHelper;
