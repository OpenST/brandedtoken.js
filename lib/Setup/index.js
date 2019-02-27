const Mosaic = require('@openstfoundation/mosaic.js');
const brandedtoken = require('./brandedtoken');
const utilitybrandedtoken = require('./utilitybrandedtoken');

module.exports = {
  organization: Mosaic.ContractInteract.organization,
  brandedtoken,
  utilitybrandedtoken,
};
