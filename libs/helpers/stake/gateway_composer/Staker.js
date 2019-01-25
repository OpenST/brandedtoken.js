'use strict';

const StakeHelper = require('./StakeHelper');

/**
 * Performs BrandedToken requestStake through GatewayComposer.
 */
class Staker {
  /**
   * StakeHelper constructor object.
   *
   * @param originWeb3 Origin chain web3 address.
   * @param valueToken Value token contract address.
   * @param brandedToken Branded Token contract address.
   * @param gatewayComposer Gateway composer contract address.
   * @param txOptions - Tx options.
   */
  constructor(originWeb3, valueToken, brandedToken, gatewayComposer, txOptions) {
    const oThis = this;
    oThis.originWeb3 = originWeb3;
    oThis.valueToken = valueToken;
    oThis.gatewayComposer = gatewayComposer;
    oThis.brandedToken = brandedToken;
    oThis.txOptions = txOptions;
  }

  async approveAndRequestStake(
    valueTokenAbi,
    owner,
    stakeVTAmountInWei,
    mintBTAmountInWei,
    gatewayAddress,
    gasPrice,
    gasLimit,
    beneficiary,
    stakerGatewayNonce
  ) {
    const oThis = this;

    const stakeHelperInstance = new StakeHelper(oThis.originWeb3, oThis.brandedToken, oThis.gatewayComposer);
    await stakeHelperInstance.approveForValueToken(
      oThis.valueToken,
      valueTokenAbi,
      stakeVTAmountInWei,
      oThis.originWeb3,
      oThis.txOptions
    );
    await stakeHelperInstance.requestStake(
      owner,
      stakeVTAmountInWei,
      mintBTAmountInWei,
      gatewayAddress,
      gasPrice,
      gasLimit,
      beneficiary,
      stakerGatewayNonce,
      oThis.originWeb3,
      oThis.txOptions
    );
  }
}

module.exports = Staker;
