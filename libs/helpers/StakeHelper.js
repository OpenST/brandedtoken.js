'use strict';

const index = require('../../index'),
  AbiBinProvider = index.AbiBinProvider,
  gatewayComposerContractName = 'GatewayComposer',
  brandedTokenContractName = 'BrandedToken';

/**
 * Performs BrandedToken staking through GatewayComposer.
 */
class StakeHelper {
  /**
   * StakeHelper constructor object.
   *
   * @param originWeb3 - Origin chain web3 address.
   * @param brandedTokenAddress - Branded Token contract address.
   * @param gatewayComposerAddress - Gateway composer contract address.
   * @param txOptions - Tx options.
   */
  constructor(originWeb3, brandedTokenAddress, gatewayComposerAddress, txOptions) {
    const oThis = this;
    oThis.originWeb3 = originWeb3;
    oThis.gatewayComposer = gatewayComposerAddress;
    oThis.brandedToken = brandedTokenAddress;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  perform() {
    // approveVT;
    // requestStake();
  }

  // TODO method to get mintBTAmountInWei from BT.

  /**
   * Performs request stake on GatewayComposer.
   *
   * @param owner - Owner of GatewayComposer contract.
   * @param stakeVTAmountInWei - ValueToken amount which is staked.
   * @param mintBTAmountInWei - Amount of BT amount which will be minted.
   * @param gatewayAddress - Gateway contract address.
   * @param beneficiary - The address in the auxiliary chain where the utility
   *                     tokens will be minted.
   * @param gasPrice - Gas price that staker is ready to pay to get the stake
   *                  and mint process done.
   * @param gasLimit - Gas limit that staker is ready to pay.
   * @param nonce -  Nonce of the staker address.
   * @param originWeb3 - Origin chain web3 object.
   * @param txOptions - Tx options.
   */
  requestStake(
    owner,
    stakeVTAmountInWei,
    mintBTAmountInWei,
    gatewayAddress,
    gasPrice,
    gasLimit,
    beneficiary,
    nonce,
    originWeb3,
    txOptions
  ) {
    const oThis = this;
    const txObject = oThis._requestStakeRawTx(
      owner,
      stakeVTAmountInWei,
      mintBTAmountInWei,
      gatewayAddress,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      originWeb3,
      txOptions
    );

    let txReceipt = null;

    return txObject
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(txReceipt), '\x1b[0m\n');
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }

  /**
   * Performs request stake on GatewayComposer.
   *
   * @param owner - Owner of GatewayComposer contract.
   * @param stakeVTAmountInWei - ValueToken amount which is staked.
   * @param mintBTAmountInWei - Amount of BT amount which will be minted.
   * @param gatewayAddress - Gateway contract address.
   * @param beneficiary - The address in the auxiliary chain where the utility
   *                     tokens will be minted.
   * @param gasPrice - Gas price that staker is ready to pay to get the stake
   *                  and mint process done.
   * @param gasLimit - Gas limit that staker is ready to pay.
   * @param nonce -  Nonce of the staker address.
   * @param originWeb3 - Origin chain web3 object.
   * @param txOptions - Tx options.
   * @private
   */
  _requestStakeRawTx(
    owner,
    stakeVTAmountInWei,
    mintBTAmountInWei,
    gatewayAddress,
    beneficiary,
    gasPrice,
    gasLimit,
    nonce,
    originWeb3,
    txOptions
  ) {
    const oThis = this;

    const web3 = originWeb3 || oThis.originWeb3;
    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(gatewayComposerContractName);

    let defaultOptions = {
      from: owner,
      to: oThis.gatewayComposer,
      gas: '8000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const contract = new web3.eth.Contract(abi, oThis.gatewayComposer, txOptions);

    const txObject = contract.methods.requestStake(
      stakeVTAmountInWei,
      mintBTAmountInWei,
      gatewayAddress,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce
    );

    return txObject;
  }
}

module.exports = StakeHelper;
