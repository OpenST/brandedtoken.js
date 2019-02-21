'use strict';

const { assert } = require('chai');

/**
` * This class includes the functions to assert sinon spy on a function.
 */
class Spy {
  /**
   * Asserts the sinon spy on a function.
   *
   * @param {Object} spy Spy object for a function.
   * @param {number} callCount number of times the function was called.
   * @param {Array} inputArgs Two dimensional array where each one
   *                          dimensional array represents input to function call.
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
        Spy.assertArguments(actualArguments, expectedArguments);
      }
    }
  }

  /**
   * This compares values of two arrays index by index.
   *
   * @param actualArguments The First array which represents the actual
   *                          value in the assertion.
   * @param expectedArguments The second array which represents the expected
   *                          value in the assertion.
   */
  static assertArguments(actualArguments, expectedArguments) {
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

module.exports = Spy;
