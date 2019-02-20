'use strict';

const { assert } = require('chai');

/**
 * This class includes the utitity functions to assert spy data.
 */
class Spy {
  /**
   * @function assertSpy
   *
   * Asserts the spy data.
   *
   * @param {Object} spy Spy object.
   * @param {number} callCount Number of times the spy was expected to be called.
   * @param {Array} inputArgs Expected input arguments to each call. Array of calls that contains arrays of call arguments of each call.
   *
   */
  static assert(spy, callCount, inputArgs) {
    assert.strictEqual(
      spy.callCount,
      callCount,
      'Call count must match with the expected value.',
    );
    if (inputArgs) {
      for (let i = 0; i < callCount; i += 1) {
        const expectedArguments = inputArgs[i];
        const actualArguments = spy.args[i];
        assert.strictEqual(
          expectedArguments.length,
          actualArguments.length,
          'Expected and actual argument counts should be same',
        );
        for (let params = 0; params < actualArguments.length; params += 1) {
          assert.strictEqual(
            actualArguments[params],
            expectedArguments[params],
            `Input param value ${
              actualArguments[params]
            } must match with the expected param value ${
              expectedArguments[params]
            }.`,
          );
        }
      }
    }
  }

  /**
   * @function assertSpy
   *
   * Asserts the spy data.
   *
   * @param {Object} spy Spy object.
   * @param {number} callCount Expected number of times the spy was called.
   */
  static assertCall(spy, callCount) {
    assert.strictEqual(
      spy.callCount,
      callCount,
      'Call count must match with the expected value.',
    );
  }
}

module.exports = Spy;
