'use strict';

const Web3 = require('web3');
const Contracts = require('../Contracts');
const AbiBinProvider = require('../AbiBinProvider');
const Utils = require('../../utils/Utils');

const ContractName = 'GatewayComposer';

/**
 * Contract interact for Gateway composer.
 */
class GatewayComposer {
  /**
   * Constructor for Gateway composer.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} address Gateway composer contract address.
   */
  constructor(web3, address) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError("Mandatory Parameter 'web3' is missing or invalid");
    }
    if (!Web3.utils.isAddress(address)) {
      throw new TypeError(
        `Mandatory Parameter 'address' is missing or invalid: ${address}`,
      );
    }

    this.web3 = web3;
    this.address = address;

    this.contract = Contracts.getGatewayComposer(this.web3, this.address);

    if (!this.contract) {
      throw new TypeError(
        `Could not load utility gateway composer contract for: ${this.address}`,
      );
    }
  }

  /**
   * Deploys a gateway composer contract.
   *
   * @param {Web3} web3 Origin chain web3 object.
   * @param {string} owner Address of the staker on the value chain.
   * @param {string} valueToken The value to which valueToken is set.
   * @param {string} brandedToken It's a value backed minted EIP20Token.
   * @param {Object} txOptions Transaction options for flexibility.
   *
   * @returns {Promise<GatewayComposer>} Promise containing the gateway composer
   *                                  instance that has been deployed.
   */
  static async deploy(
    web3,
    owner,
    valueToken,
    brandedToken,
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

    const tx = GatewayComposer.deployRawTx(
      web3,
      owner,
      valueToken,
      brandedToken,
    );

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new GatewayComposer(web3, address);
    });
  }

  /**
   * Raw transaction for {@link GatewayComposer#deploy}.
   *
   * @param {Web3} web3 Origin chain web3 object.
   * @param {string} owner Address of the staker on the value chain.
   * @param {string} valueToken The value to which valueToken is set.
   * @param {string} brandedToken It's a value backed minted EIP20Token.
   *
   * @returns {Object} Raw transaction.
   */
  static deployRawTx(
    web3,
    owner,
    valueToken,
    brandedToken,
  ) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError(
        `Mandatory Parameter 'web3' is missing or invalid: ${web3}`,
      );
    }
    if (!Web3.utils.isAddress(valueToken)) {
      throw new TypeError(`Invalid valueToken address: ${valueToken}.`);
    }
    if (!Web3.utils.isAddress(brandedToken)) {
      throw new TypeError(`Invalid branded token address: ${brandedToken}.`);
    }

    const abiBinProvider = new AbiBinProvider();
    const bin = abiBinProvider.getBIN(ContractName);

    const args = [
      valueToken,
      owner,
      valueToken,
      brandedToken,
    ];

    const contract = Contracts.getGatewayComposer(web3, null, null);

    return contract.deploy(
      {
        data: bin,
        arguments: args,
      },
    );
  }
}

module.exports = GatewayComposer;
