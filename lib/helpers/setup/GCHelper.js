'use strict';

const AbiBinProvider = require('../../AbiBinProvider');
const Utils = require('../../../utils/Utils');
const logger = require('../../../logger');

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
      const message = 'Mandatory parameter "config" missing. ';
      logger.error(message);
      throw new Error(message);
    }

    if (!config.owner) {
      const message = 'Mandatory configuration "owner" missing. Set config.owner address';
      logger.error(message);
      throw new Error(message);
    }

    if (!config.valueToken) {
      const message = 'Mandatory configuration "valueToken" missing. Set config.valueToken address';
      logger.error(message);
      throw new Error(message);
    }

    if (!config.brandedToken) {
      const message = 'Mandatory configuration "brandedToken" missing. Set config.brandedToken address';
      logger.error(message);
      throw new Error(message);
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

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      oThis.address = txReceipt.contractAddress;
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

    const defaultOptions = {};
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
