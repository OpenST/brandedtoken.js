'use strict';

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
        .on('receipt', receipt => onResolve(receipt))
        .on('error', error => onReject(error))
        .catch(exception => onReject(exception));
    });
  }

  /**
   * Prints a deprecation warning for deprecated Economy setup methods.
   * See {@link 'https://github.com/OpenST/brandedtoken.js#economy-setup'.
   *
   * @param {string} object Identifier of the chain setup related object that has been deprecated.
   */
  static deprecationNoticeEconomySetup(object) {
    const link = 'https://github.com/OpenST/brandedtoken.js#economy-setup';
    Utils.deprecationNoticeWithLink(object, link);
  }

  /**
   * Prints a deprecation warning for deprecated StakeHelper.
   * See {@link https://github.com/OpenST/brandedtoken.js/issues/119}.
   *
   * @param {string} [method] The method on the StakeHelper that is deprecated.
   */
  static deprecationNoticeStakeHelper(method) {
    const issueNumber = '119';

    let object = 'StakeHelper';
    if (method !== undefined) {
      object = `${object}::${method}()`;
    }

    Utils.deprecationNoticeWithIssue(object, issueNumber);
  }

  /**
   * Prints a deprecation warning for deprecated code.
   *
   * @param {string} object Identifier of what has been deprecated.
   * @param {string} link Link that has instructions on how to migrate.
   *
   */
  static deprecationNoticeWithLink(object, link) {
    console.warn(
      `⚠️ '${object}' has been deprecated. See ${link}`,
    );
  }


  /**
   * Prints a deprecation warning for deprecated code.
   *
   * @param {string} object Identifier of what has been deprecated.
   * @param {string} issueNumber Issue number on GitHub that has instructions on how to migrate.
   */
  static deprecationNoticeWithIssue(object, issueNumber) {
    console.warn(
      `⚠️ '${object}' has been deprecated. See https://github.com/OpenST/brandedtoken.js/issues/${issueNumber} for migration instructions.`,
    );
  }
}

module.exports = Utils;
