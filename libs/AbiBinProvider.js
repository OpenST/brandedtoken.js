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
    let abi = null;
    try {
      abi = super.getABI(contractName);
    } catch (e) {
      //__NOT_FOR_WEB__BEGIN__
      let fPath = path.resolve(__dirname, oThis.abiFolderPath, contractName + '.abi');
      let abiFileContent = fs.readFileSync(fPath, 'utf8');
      abi = JSON.parse(abiFileContent);
      //__NOT_FOR_WEB__END__
    }
    return abi;
  }

  getBIN(contractName) {
    const oThis = this;
    let bin = null;
    try {
      bin = super.getBIN(contractName);
    } catch (e) {
      //__NOT_FOR_WEB__BEGIN__
      let fPath = path.resolve(__dirname, oThis.binFolderPath, contractName + '.bin');
      bin = fs.readFileSync(fPath, 'utf8');
      if (typeof bin === 'string' && bin.indexOf('0x') != 0) {
        bin = '0x' + bin;
      }
      //__NOT_FOR_WEB__END__
    }
    return bin;
  }
}

module.exports = BtAbiBinProvider;
