'use strict';

const Web3 = require('web3');
const Mosaic = require('@openst/mosaic.js');

const Contracts = require('../Contracts');
const AbiBinProvider = require('../AbiBinProvider');
const Utils = require('../../utils/Utils');

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
      throw new Error(`Could not load Utility contract for: ${this.address}`);
    }

    this.registerInternalActorsRawTx = this.registerInternalActorsRawTx.bind(this);
    this.registerInternalActors = this.registerInternalActors.bind(this);
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
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
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
      throw new TypeError(
        `Mandatory Parameter 'web3' is missing or invalid: ${web3}`,
      );
    }
    if (!Web3.utils.isAddress(valueToken)) {
      throw new TypeError(`Invalid valueToken address: ${valueToken}.`);
    }
    if (!Web3.utils.isAddress(organization)) {
      throw new TypeError(`Invalid organization address: ${organization}.`);
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
  async registerInternalActors(addresses, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address ${txOptions.from} in transaction options.`);
      return Promise.reject(err);
    }

    const tx = await this.registerInternalActorsRawTx(
      addresses,
    );

    return Utils.sendTransaction(tx, txOptions);
  }

  /**
   * Raw tx for registerInternalActors.
   *
   * @param {Array} addresses List of addresses need to register for internal
   *                          actor.
   *
   * @return Promise<Object> Raw transaction object.
   */
  registerInternalActorsRawTx(addresses) {
    if (!addresses || addresses.length === 0) {
      const err = new TypeError(
        `At least one addresses must be defined : ${addresses}`,
      );
      return Promise.reject(err);
    }

    return Promise.resolve(
      this.contract.methods.registerInternalActors(
        addresses,
      ),
    );
  }
}

module.exports = UtilityBrandedToken;
