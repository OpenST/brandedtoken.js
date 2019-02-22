'use strict';

const { assert } = require('chai');

/**
 * This class includes the function to assert promise.
 */
class AssertAsync {
  /**
   * This asserts that given promise is rejected with expected message.
   *
   * @param {Promise<Object>} promise Promise which needs to be asserted.
   * @param {string} message Expected message in promise rejection.
   */
  static async reject(promise, message) {
    try {
      await promise;
      throw new Error('Promise must reject');
    } catch (exception) {
      assert.strictEqual(
        exception.message,
        message,
        `Exception reason must be "${message}" but found "${
          exception.message
        }"`,
      );
    }
  }
}

module.exports = AssertAsync;
