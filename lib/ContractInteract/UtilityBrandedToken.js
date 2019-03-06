'use strict';

const Web3 = require('web3');
const Mosaic = require('@openstfoundation/mosaic.js');

const Contracts = require('../Contracts');
const AbiBinProvider = require('../AbiBinProvider');
const Utils = require('../../utils/Utils');
const logger = require('../../logger');

const ContractName = 'UtilityBrandedToken';

/**
 * Contract interact for UtilityBrandedToken contract.
 */
class UtilityBrandedToken extends Mosaic.ContractInteract.UtilityToken {
  /**
   * Constructor for UtilityBrandedToken.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} address UtilityBrandedToken contract address.
   */
  constructor(web3, address) {
    super(web3, address);
    this.contract = Contracts.getUtilityBrandedToken(this.web3, this.address);

    if (!this.contract) {
      const message = `Could not load Utility contract for: ${this.address}`;
      logger.error(message);
      throw new Error(message);
    }

    this.registerInternalActorRawTx = this.registerInternalActorRawTx.bind(this);
    this.registerInternalActor = this.registerInternalActor.bind(this);
  }

  /**
   * Deploys an Utility token contract.
   *
   * @param {Web3} web3 Web3 object.
   * @param {string} valueToken Address of EIP20 Token on Origin chain.
   * @param {string} symbol Symbol of utility token.
   * @param {string} name Name of utility token.
   * @param {string} decimal Decimal of utility token.
   * @param {string} organization Address of Organization contract managing
   *                 utility token.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<UtilityBrandedToken>} Promise containing the UtilityBrandedToken instance
   *                                  that has been deployed.
   */
  static async deploy(
    web3,
    valueToken,
    symbol,
    name,
    decimal,
    organization,
    txOptions,
  ) {
    if (!txOptions) {
      const message = 'Invalid transaction options.';
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const message = `Invalid from address: ${txOptions.from}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }

    const tx = UtilityBrandedToken.deployRawTx(
      web3,
      valueToken,
      symbol,
      name,
      decimal,
      organization,
    );

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new UtilityBrandedToken(web3, address);
    });
  }

  /**
   * Raw transaction for {@link UtilityBrandedToken#deploy}.
   *
   * @param {Web3} web3 Web3 object.
   * @param {string} valueToken Address of EIP20 Token on Origin chain.
   * @param {string} symbol Symbol of utility token.
   * @param {string} name Name of utility token.
   * @param {string} decimal Decimal of utility token.
   * @param {string} organization Address of Organization contract managing
   *                              Utility token.
   *
   * @returns {Object} Raw transaction.
   */
  static deployRawTx(web3, valueToken, symbol, name, decimal, organization) {
    if (!(web3 instanceof Web3)) {
      const message = `Mandatory Parameter 'web3' is missing or invalid: ${web3}`;
      logger.error(message);
      throw new TypeError(
        message,
      );
    }
    if (!Web3.utils.isAddress(valueToken)) {
      const message = `Invalid valueToken address: ${valueToken}.`;
      logger.error(message);
      throw new TypeError(message);
    }
    if (!Web3.utils.isAddress(organization)) {
      const message = `Invalid organization address: ${organization}.`;
      logger.error(message);
      throw new TypeError(message);
    }

    const abiBinProvider = new AbiBinProvider();
    const contract = Contracts.getUtilityBrandedToken(web3, null, null);

    const bin = abiBinProvider.getBIN(ContractName);
    const args = [valueToken, symbol, name, decimal, organization];

    return contract.deploy({
      data: bin,
      arguments: args,
    });
  }

  /**
   * Method to register internal actor. This transaction should submit by
   * worker.
   *
   * @param {Array} addresses List of addresses need to register for internal
   *                          actor.
   * @param {Object} txOptions Transaction options.
   *
   * @return {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async registerInternalActor(addresses, txOptions) {
    if (!txOptions) {
      const message = `Invalid transaction options: ${txOptions}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const message = `Invalid from address ${txOptions.from} in transaction options.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }

    const tx = await this.registerInternalActorRawTx(
      addresses,
    );

    return Utils.sendTransaction(tx, txOptions);
  }

  /**
   * Raw tx for registerInternalActor.
   *
   * @param {Array} addresses List of addresses need to register for internal
   *                          actor.
   *
   * @return Promise<Object> Raw transaction object.
   */
  registerInternalActorRawTx(addresses) {
    if (!addresses || addresses.length === 0) {
      const message = `At least one addresses must be defined : ${addresses}`;
      logger.error(message);
      const err = new TypeError(
        message,
      );
      return Promise.reject(err);
    }

    return Promise.resolve(
      this.contract.methods.registerInternalActor(
        addresses,
      ),
    );
  }
}

module.exports = UtilityBrandedToken;
