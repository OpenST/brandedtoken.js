'use strict';

const logger = require('../logger');
/**
 * This class includes the functions shared among various classes.

 */
class Utils {
  /**
   * This function sends ethereum transaction.
   *
   * @param {Object} tx Raw transaction object generated from web3.
   * @param {Object} txOption Transaction options.
   *
   * @returns {Promise<Object>} Promise object of transaction receipt in case of
   *                            success otherwise error.
   */
  static async sendTransaction(tx, txOption) {
    return new Promise(async (onResolve, onReject) => {
      const txOptions = Object.assign({}, txOption);
      if (!txOptions.gas) {
        txOptions.gas = await tx.estimateGas(txOptions);
      }

      tx.send(txOptions)
        .on('transactionHash', (transactionHash) => {
          logger.info(`Transaction Hash : ${transactionHash}`);
        })
        .on('receipt', receipt => onResolve(receipt))
        .on('error', (error) => {
          logger.error(`Error while sending transaction ${error}`);
          return onReject(error);
        })
        .catch((exception) => {
          logger.error(`Exception while sending transaction ${exception}`);
          return onReject(exception);
        });
    });
  }
}

module.exports = Utils;
