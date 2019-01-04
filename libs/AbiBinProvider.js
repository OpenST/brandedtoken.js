'use strict';

//__NOT_FOR_WEB__BEGIN__
const fs = require('fs'),
  path = require('path');
//__NOT_FOR_WEB__END__

const mosaicTBD = require('mosaic-tbd');
const mAbiBinProvider = mosaicTBD.AbiBinProvider;

class AbiBinProvider extends mAbiBinProvider {
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

module.exports = AbiBinProvider;
