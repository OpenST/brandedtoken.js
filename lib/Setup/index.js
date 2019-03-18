'use strict';

const Mosaic = require('@openst/mosaic.js');
const brandedtoken = require('./brandedtoken');
const utilitybrandedtoken = require('./utilitybrandedtoken');

/**
 * @file The Setup module provides an abstraction layer to simplify
 * deployment and setup of a branded token.
 */

module.exports = {
  organization: Mosaic.ContractInteract.Organization.setup,
  brandedtoken,
  utilitybrandedtoken,
};
