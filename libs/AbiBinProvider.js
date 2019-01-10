'use strict';

//__NOT_FOR_WEB__BEGIN__
const fs = require('fs'),
  path = require('path');
//__NOT_FOR_WEB__END__

const Mosaic = require('mosaic-tbd');
const AbiBinProvider = Mosaic.AbiBinProvider;

let DEFAULT_ABI_FOLDER_PATH, DEFAULT_BIN_FOLDER_PATH;
//__NOT_FOR_WEB__BEGIN__
DEFAULT_ABI_FOLDER_PATH = path.resolve(__dirname, '../contracts/abi/');
DEFAULT_BIN_FOLDER_PATH = path.resolve(__dirname, '../contracts/bin/');
//__NOT_FOR_WEB__END__

class BtAbiBinProvider extends AbiBinProvider {
  constructor(abiFolderPath, binFolderPath, mosaicAbiFolderPath, mosaicBinFolderPath) {
    abiFolderPath = abiFolderPath || DEFAULT_ABI_FOLDER_PATH;
    binFolderPath = binFolderPath || DEFAULT_BIN_FOLDER_PATH;
    super(abiFolderPath, binFolderPath);
    this.mosaicAbiBinProvider = new AbiBinProvider(mosaicAbiFolderPath, mosaicBinFolderPath);
  }

  getABI(contractName) {
    const oThis = this;
    let abi = null;
    try {
      abi = super.getABI(contractName);
    } catch (e) {
      //Just catch the exception. Do nothing.
    }

    if (!abi) {
      //We did not find abi in our location.
      //Lets get it from mosaicAbiBinProvider.
      return mosaicAbiBinProvider.getABI(contractName);
    }

    return abi;
  }

  getBIN(contractName) {
    const oThis = this;
    let bin = null;
    try {
      bin = super.getBIN(contractName);
    } catch (e) {
      //Just catch the exception. Do nothing.
    }

    if (!bin) {
      //We did not find abi in our location.
      //Lets get it from mosaicAbiBinProvider.
      return mosaicAbiBinProvider.getBIN(contractName);
    }
    return bin;
  }
}

module.exports = BtAbiBinProvider;
