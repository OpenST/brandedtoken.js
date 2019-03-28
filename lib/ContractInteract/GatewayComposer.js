'use strict';

const Web3 = require('web3');
const Contracts = require('../Contracts');
const AbiBinProvider = require('../AbiBinProvider');
const Utils = require('../../utils/Utils');
const logger = require('../../logger');

const { BN } = Web3.utils;

const ContractName = 'GatewayComposer';

/**
 * Contract interact for Gateway composer.
 */
class GatewayComposer {
  /**
   * Constructor for Gateway composer.
   *
   * @param {Web3} web3 Web3 instance that points to origin.
   * @param {string} address Gateway composer contract address.
   */
  constructor(web3, address) {
    if (!(web3 instanceof Web3)) {
      const message = "Mandatory Parameter 'web3' is missing or invalid";
      logger.error(message);
      throw new TypeError(message);
    }
    if (!Web3.utils.isAddress(address)) {
      const message = `Mandatory Parameter 'address' is missing or invalid: ${address}`;
      logger.error(message);
      throw new TypeError(
        message,
      );
    }

    this.web3 = web3;
    this.address = address;

    this.contract = Contracts.getGatewayComposer(this.web3, this.address);

    if (!this.contract) {
      const message = `Could not load gateway composer contract for: ${this.address}`;
      logger.error(message);
      throw new TypeError(
        message,
      );
    }

    this.requestStake = this.requestStake.bind(this);
    this.requestStakeRawTx = this.requestStakeRawTx.bind(this);
    this.acceptStakeRequest = this.acceptStakeRequest.bind(this);
    this.acceptStakeRequestRawTx = this.acceptStakeRequestRawTx.bind(this);
    this.revokeStakeRequest = this.revokeStakeRequest.bind(this);
    this.revokeStakeRequestRawTx = this.revokeStakeRequestRawTx.bind(this);
    this.revertStake = this.revertStake.bind(this);
    this.revertStakeRawTx = this.revertStakeRawTx.bind(this);
  }

  /**
   * Deploys a gateway composer contract.
   *
   * @param {Web3} web3 Origin chain web3 object.
   * @param {string} owner Address of the staker on the value chain.
   * @param {string} valueToken Address of value token contract.
   * @param {string} brandedToken Address of brandedToken contract.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<GatewayComposer>} Promise containing the gateway composer
   *                                     instance that has been deployed.
   */
  static async deploy(
    web3,
    owner,
    valueToken,
    brandedToken,
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
   * @param {string} valueToken Address of value token contract.
   * @param {string} brandedToken Address of brandedToken contract.
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
    if (!Web3.utils.isAddress(brandedToken)) {
      const message = `Invalid branded token address: ${brandedToken}.`;
      logger.error(message);
      throw new TypeError(message);
    }

    const abiBinProvider = new AbiBinProvider();
    const bin = abiBinProvider.getBIN(ContractName);

    const args = [
      owner,
      valueToken,
      brandedToken,
    ];

    const contract = Contracts.getGatewayComposer(web3);

    return contract.deploy(
      {
        data: bin,
        arguments: args,
      },
    );
  }

  /**
   * Method for request stake. This transfers value tokens from caller to
   * GatewayComposer.
   *
   * @param {string} stakeVT Stake amount in wei.
   * @param {string} mintBT Minted amount in wei.
   * @param {string }gateway Address of gateway contract.
   * @param {string} beneficiary Beneficiary address on auxiliary chain.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} nonce Staker nonce managed by gateway contract.
   * @param {Object} txOptions Transaction options.
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
   * @param {string} stakeVT Stake amount in wei.
   * @param {string} mintBT Minted amount in wei.
   * @param {string }gateway Address of gateway contract
   * @param {string} beneficiary Beneficiary address on auxiliary chain.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} nonce Staker nonce managed by gateway contract.
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
      const message = `Stake amount must be greater than zero: ${stakeVT}.`;
      logger.error(message);
      const err = new TypeError(
        message,
      );
      return Promise.reject(err);
    }
    if (!new BN(mintBT).gtn(0)) {
      const message = `Mint amount must be greater than zero: ${mintBT}.`;
      logger.error(message);
      const err = new TypeError(
        message,
      );
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(gateway)) {
      const message = `Invalid gateway address: ${gateway}.`;
      logger.error(message);
      const err = new TypeError(
        message,
      );
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(beneficiary)) {
      const message = `Invalid beneficiary address: ${beneficiary}.`;
      logger.error(message);
      const err = new TypeError(
        message,
      );
      return Promise.reject(err);
    }
    if (gasPrice === undefined) {
      const message = `Invalid gas price: ${gasPrice}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }
    if (gasLimit === undefined) {
      const message = `Invalid gas limit: ${gasLimit}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }
    if (typeof nonce !== 'string') {
      const message = `Invalid nonce: ${nonce}.`;
      logger.error(message);
      const err = new TypeError(message);
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

  /**
   * Accept open stake request identified by request hash.
   *
   * @param {string} stakeRequestHash Hash of stake request information
   *                                  calculated per EIP 712.
   * @param {string} r R of signature received from worker.
   * @param {string} s s of signature received from worker.
   * @param {string} v v of signature received from worker.
   * @param {string} hashLock hashLock provided by the facilitator.
   * @param {Object} txOptions Transaction options
   *
   * @return {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async acceptStakeRequest(stakeRequestHash, r, s, v, hashLock, txOptions) {
    if (!txOptions) {
      const message = `Invalid transaction options: ${txOptions}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const message = `Invalid from address ${txOptions.from} in transaction options.`;
      logger.error(message);
      const err = new TypeError(
        message,
      );
      return Promise.reject(err);
    }

    const tx = await this.acceptStakeRequestRawTx(stakeRequestHash, r, s, v, hashLock);
    return Utils.sendTransaction(tx, txOptions);
  }

  /**
   * Raw transaction for accept stake request.
   *
   * @param stakeRequestHash {string} Hash of stake request information calculated per
   *                                  EIP 712.
   * @param {string} r R of signature received from worker.
   * @param {string} s s of signature received from worker.
   * @param {string} v v of signature received from worker.
   * @param {string} hashLock 32 bytes value provided by the facilitator.
   *
   * @return Promise<Object> Raw transaction object.
   */
  acceptStakeRequestRawTx(stakeRequestHash, r, s, v, hashLock) {
    if (!stakeRequestHash) {
      const message = `Invalid stakeRequestHash: ${stakeRequestHash}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }
    if (!r) {
      const message = `Invalid r of signature: ${r}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }
    if (!s) {
      const message = `Invalid s of signature: ${s}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }
    if (!v) {
      const message = `Invalid v of signature: ${v}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }

    if (!hashLock) {
      const message = `Invalid hashLock of signature: ${hashLock}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }

    return Promise.resolve(
      this.contract.methods.acceptStakeRequest(
        stakeRequestHash,
        r,
        s,
        v,
        hashLock,
      ),
    );
  }

  /**
   * Revoke open stake request identified by request hash. This can be done only
   * if accept stake request is not done.
   *
   * @param {string} stakeRequestHash Hash of stake request information
   *                                  calculated per EIP 712.
   * @param {Object} txOptions Transaction options
   *
   * @return {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async revokeStakeRequest(stakeRequestHash, txOptions) {
    if (!txOptions) {
      const message = `Invalid transaction options: ${txOptions}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const message = `Invalid from address ${txOptions.from} in transaction options.`;
      logger.error(message);
      const err = new TypeError(
        message,
      );
      return Promise.reject(err);
    }

    const tx = await this.revokeStakeRequestRawTx(stakeRequestHash);
    return Utils.sendTransaction(tx, txOptions);
  }

  /**
   * Raw transaction for revoke stake request.
   *
   * @param {string} stakeRequestHash Hash of stake request information
   *                                  calculated per EIP 712.
   *
   * @return Promise<Object> Raw transaction object.
   */
  revokeStakeRequestRawTx(stakeRequestHash) {
    if (!stakeRequestHash) {
      const message = `Invalid stakeRequestHash: ${stakeRequestHash}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }

    return Promise.resolve(
      this.contract.methods.revokeStakeRequest(
        stakeRequestHash,
      ),
    );
  }

  /**
   * Revert open stake request identified by message hash. This can only be
   * done after accept stake request.
   *
   * @param {string} gateway Address of gateway contract.
   * @param {string} penalty amount of penalty in wei charged to staker for
   *                 revert.
   * @param {string} messageHash hash used by gateway to identify message.
   * @param {Object} txOptions Transaction options
   *
   * @return {Promise<Object>} Promise that resolves to transaction receipt.
   */
  async revertStake(gateway, penalty, messageHash, txOptions) {
    if (!txOptions) {
      const message = `Invalid transaction options: ${txOptions}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const message = `Invalid from address ${txOptions.from} in transaction options.`;
      logger.error(message);
      const err = new TypeError(
        message,
      );
      return Promise.reject(err);
    }

    const tx = await this.revertStakeRawTx(gateway, penalty, messageHash);
    return Utils.sendTransaction(tx, txOptions);
  }

  /**
   * Raw transaction for revert stake request.
   *
   * @param {string} gateway Address of gateway contract.
   * @param {string} penalty amount of penalty in wei charged to staker for
   *                 revert.
   * @param {string} messageHash hash used by gateway to identify message.
   *
   * @return Promise<Object> Raw transaction object.
   */
  revertStakeRawTx(gateway, penalty, messageHash) {
    if (!Web3.utils.isAddress(gateway)) {
      const message = `Invalid gateway address: ${gateway}.`;
      logger.error(message);
      const err = new TypeError(
        message,
      );
      return Promise.reject(err);
    }
    if (!penalty) {
      const message = `Invalid penalty: ${penalty}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }
    if (!messageHash) {
      const message = `Invalid messageHash: ${messageHash}.`;
      logger.error(message);
      const err = new TypeError(message);
      return Promise.reject(err);
    }

    return Promise.resolve(
      this.contract.methods.revertStake(
        gateway,
        penalty,
        messageHash,
      ),
    );
  }
}

module.exports = GatewayComposer;
