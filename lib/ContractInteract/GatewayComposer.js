'use strict';

const Web3 = require('web3');
const Contracts = require('../Contracts');
const AbiBinProvider = require('../AbiBinProvider');
const Utils = require('../../utils/Utils');

const { BN } = Web3.utils;

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

  /**
   * Method for request stake.
   *
   * @param {string} stakeVT Stake amount.
   * @param {string} mintBT Minted amount.
   * @param {string }gateway Address of gateway contract
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} nonce Staker nonce.
   * @param txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async requestStake(
    stakeVT,
    mintBT,
    gateway,
    beneficiary,
    gasPrice,
    gasLimit,
    nonce,
    txOptions,
  ) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address ${txOptions.from} in transaction options.`);
      return Promise.reject(err);
    }

    const tx = await this.requestStakeRawTx(
      stakeVT,
      mintBT,
      gateway,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
    );

    return Utils.sendTransaction(tx, txOptions);
  }


  /**
   * Raw transaction for request stake.
   *
   * @param {string} stakeVT Stake amount.
   * @param {string} mintBT Minted amount.
   * @param {string }gateway Address of gateway contract
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} nonce Staker nonce.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction.
   */
  requestStakeRawTx(
    stakeVT,
    mintBT,
    gateway,
    beneficiary,
    gasPrice,
    gasLimit,
    nonce,
  ) {
    if (!new BN(stakeVT).gtn(0)) {
      const err = new TypeError(
        `Stake amount must be greater than zero: ${stakeVT}.`,
      );
      return Promise.reject(err);
    }
    if (!new BN(mintBT).gtn(0)) {
      const err = new TypeError(
        `Mint amount must be greater than zero: ${mintBT}.`,
      );
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(gateway)) {
      const err = new TypeError(
        `Invalid gateway address: ${gateway}.`,
      );
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(beneficiary)) {
      const err = new TypeError(
        `Invalid beneficiary address: ${beneficiary}.`,
      );
      return Promise.reject(err);
    }
    if (gasPrice === undefined) {
      const err = new TypeError(`Invalid gas price: ${gasPrice}.`);
      return Promise.reject(err);
    }
    if (gasLimit === undefined) {
      const err = new TypeError(`Invalid gas limit: ${gasLimit}.`);
      return Promise.reject(err);
    }
    if (typeof nonce !== 'string') {
      const err = new TypeError(`Invalid nonce: ${nonce}.`);
      return Promise.reject(err);
    }

    return Promise.resolve(
      this.contract.methods.requestStake(
        stakeVT,
        mintBT,
        gateway,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
      ),
    );
  }
}

module.exports = GatewayComposer;
