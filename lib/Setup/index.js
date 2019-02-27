const Mosaic = require('@openstfoundation/mosaic.js');
const brandedtoken = require('./brandedtoken');
const utilitybrandedtoken = require('./utilitybrandedtoken');

module.exports = {
  Organization: Mosaic.ContractInteract.Organization,
  brandedtoken,
  utilitybrandedtoken,
};
