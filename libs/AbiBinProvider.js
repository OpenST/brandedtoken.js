'use strict';

//__NOT_FOR_WEB__BEGIN__
const fs = require('fs'),
  path = require('path');
//__NOT_FOR_WEB__END__

const Mosaic = require('mosaic-tbd');
const AbiBinProvider = Mosaic.AbiBinProvider;

/*
  Note: Extending is not really a great idea here.
  Eventually, many packages may end-up extending the original AbiBinProvider.
  Solution:
  The AbiBinProvider of the mosaic-tbd should be able to add look-up paths.
  Then, it should be able to look-up through all locations and return the correct ABI/BIN.
*/

class BtAbiBinProvider extends AbiBinProvider {
  getABI(contractName) {
    const oThis = this;
    let abi = null,
      abiFileContent;
    try {
      abi = super.getABI(contractName);
      return abi;
    } catch (e) {
      //__NOT_FOR_WEB__BEGIN__
      abiFileContent = fs.readFileSync(oThis.abiFolderPath + contractName + '.abi', 'utf8');
      abi = JSON.parse(abiFileContent);
      return abi;
      //__NOT_FOR_WEB__END__
    }
  }

  getBIN(contractName) {
    const oThis = this;
    let bin = null,
      binFileContent;
    try {
      bin = super.getBIN(contractName);
      return bin;
    } catch (e) {
      //__NOT_FOR_WEB__BEGIN__
      bin = fs.readFileSync(oThis.binFolderPath + contractName + '.bin', 'utf8');
      return bin;
      //__NOT_FOR_WEB__END__
    }
  }
}

module.exports = BtAbiBinProvider;
