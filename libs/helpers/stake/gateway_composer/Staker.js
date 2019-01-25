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

  /**
   * Performs approve and requestStake on GatewayComposer.
   *
   * @param valueTokenAbi ValueToken contract ABI.
   * @param owner Owner of GatewayComposer contract.
   * @param stakeVTAmountInWei ValueToken amount which is staked.
   * @param mintBTAmountInWei Amount of BT amount which will be minted.
   * @param gatewayAddress Gateway contract address.
   * @param gasPrice Gas price that staker is ready to pay to get the stake
   *                  and mint process done.
   * @param gasLimit Gas limit that staker is ready to pay.
   * @param beneficiary The address in the auxiliary chain where the utility
   *                     tokens will be minted.
   * @param stakerGatewayNonce Nonce of the staker address stored in Gateway.
   */
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
