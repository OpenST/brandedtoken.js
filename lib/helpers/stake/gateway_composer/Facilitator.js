'use strict';

const StakeHelper = require('./StakeHelper');

/**
 * Facilitator performs below tasks:
 * - approves bounty amount to GatewayComposer
 * - calls GatewayComposer.acceptStakeRequest
 */
class Facilitator {
  /**
   * Facilitator constructor object.
   *
   * @param {Web3} originWeb3 Origin chain web3 address.
   * @param {string} valueToken Value token contract address.
   * @param {string} brandedToken Branded Token contract address.
   * @param {string} gatewayComposer Gateway composer contract address.
   * @param {string} facilitator Facilitator address.
   * @param {BtAbiBinProvider} abiBinProvider A class that provides ABIs and BINs.
   */
  constructor(
    originWeb3,
    valueToken,
    brandedToken,
    gatewayComposer,
    facilitator,
    abiBinProvider,
  ) {
    this.originWeb3 = originWeb3;
    this.valueToken = valueToken;
    this.gatewayComposer = gatewayComposer;
    this.brandedToken = brandedToken;
    this.facilitator = facilitator;
    this.abiBinProvider = abiBinProvider;

    this.acceptStakeRequest = this.acceptStakeRequest.bind(this);
  }

  /**
   * Facilitator performs below tasks:
   * - approves bounty amount to GatewayComposer
   * - calls GatewayComposer.acceptStakeRequest
   *
   * Note: Add KYC worker account/private key in web3 wallet before calling acceptStakeRequest.
   *
   * @param {string} stakeRequestHash Stake request hash unique for each stake.
   * @param {Object} signature Signature object format:
   * @param {string} signature.messageHash The hash of the signed message.
   * @param {string} signature.v V of the signature.
   * @param {string} signature.r R of the signature.
   * @param {string} signature.s S of the signature.
   * @param {string} signature.signature Signature.
   * @param {string} bountyInWei Bounty amount in wei's that needs to be approved.
   * @param {string} hashLock Hashed secret of facilitator.
   * @param {Object} txOptions Transaction options used with web3.
   */
  async acceptStakeRequest(
    stakeRequestHash,
    signature,
    bountyInWei,
    hashLock,
    txOptions,
  ) {
    const stakeHelperInstance = new StakeHelper(
      this.originWeb3,
      this.brandedToken,
      this.gatewayComposer,
    );

    const valueTokenAbi = this.abiBinProvider.getABI('EIP20Token');

    const approveForBountyResult = await stakeHelperInstance.approveForBounty(
      this.facilitator,
      bountyInWei,
      this.valueToken,
      valueTokenAbi,
      this.originWeb3,
    );
    console.log('approveForBounty status:', approveForBountyResult.status);

    const acceptStakeRequestResult = await stakeHelperInstance.acceptStakeRequest(
      stakeRequestHash,
      signature,
      this.facilitator,
      hashLock,
      this.originWeb3,
      txOptions,
    );
    console.log('acceptStakeRequest status:', acceptStakeRequestResult.status);
  }
}

module.exports = Facilitator;
