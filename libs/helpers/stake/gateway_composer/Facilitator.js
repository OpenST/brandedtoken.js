'use strict';

const StakeHelper = require('./../StakeHelper');

/**
 * Performs BrandedToken acceptStake through GatewayComposer.
 */
class Facilitator {
  /**
   * StakeHelper constructor object.
   *
   * @param originWeb3 Origin chain web3 address.
   * @param brandedToken Branded Token contract address.
   * @param gatewayComposer Gateway composer contract address.
   * @param facilitator Facilitator address.
   * @param txOptions - Tx options.
   */
  constructor(originWeb3, brandedToken, gatewayComposer, facilitator, txOptions) {
    const oThis = this;
    oThis.originWeb3 = originWeb3;
    oThis.gatewayComposer = gatewayComposer;
    oThis.brandedToken = brandedToken;
    oThis.facilitator = facilitator;
  }

  /**
   * Facilitator performs accept stake request.
   * Note: Add KYC worker account/private key in web3 wallet before calling acceptStakeRequest.
   *
   * @param stakeRequestHash Stake request hash unique for each stake.
   * @param stakeAmountInWei Stake amount in wei.
   * @param btStakeRequestNonce BrandedToken StakeRequest nonce.
   * @param workerAddress KYC worker address.
   * @param hashLock HashLock of facilitator.
   * @param originWeb3 Origin chain web3 object.
   * @param txOptions Tx options.
   */
  acceptStakeRequest(
    stakeRequestHash,
    stakeAmountInWei,
    btStakeRequestNonce,
    workerAddress,
    hashLock,
    originWeb3,
    txOptions
  ) {
    const stakeHelperInstance = new StakeHelper(
      oThis.originWeb3,
      oThis.brandedToken,
      oThis.gatewayComposer,
      oThis.txOptions
    );
    return stakeHelperInstance.acceptStakeRequest(
      stakeRequestHash,
      stakeAmountInWei,
      btStakeRequestNonce,
      workerAddress,
      hashLock,
      originWeb3,
      txOptions
    );
  }
}

module.exports = Facilitator;
