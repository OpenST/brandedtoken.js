'use strict';

const Web3 = require('web3');
const Mosaic = require('mosaic-tbd');
const AbiBinProvider = require('../libs/AbiBinProvider');
const BTHelper = require('../libs/helpers/BTHelper');

class EconomySetup extends Mosaic.ChainSetup {
  constructor(originWeb3, auxiliaryWeb3) {
    super(originWeb3, auxiliaryWeb3);
  }

  static get BTHelper() {
    return BTHelper;
  }

  setup() {
    /*
          |---------------------------------------|---------------------------------------|
          |            Chain-Setup                |               Economy-Setup           |
          |---------------------------------------|---------------------------------------|
          |                       A. Deploy and Prepare Origin EIP-20                     |
          |---------------------------------------|---------------------------------------|
          | 1. Deploy (Token) Organization [Orig] | 1. Deploy (Token) Organization [Orig] |
          | 2. Deploy MockSimpleToken [Orig]      | 2. Deploy Branded Token [Orig]        |
          | * On Mainnet SimpleToken is           |                                       |
          |   already deployed.                   |                                       |
          |---------------------------------------|---------------------------------------|
          |                          B. Deploy Utility Token                              |
          |---------------------------------------|---------------------------------------|
          | 1. Deploy (Token) Organization [Aux]  | 1. Deploy (Token) Organization [Aux]  |
          | 2. Deploy OSTPrime [Aux]              | 2. Deploy Utility Branded Token [Aux] |
          |---------------------------------------|---------------------------------------|
          |                      C. Deploy and Prepare Anchors                            |
          |---------------------------------------|---------------------------------------|
          | 1. Deploy (Anchor) Organization [Orig]| * Do nothing, get address of Anchors  |
          | 2. Deploy Anchor [Orig]               |   deployed during chain-setup         |
          | 3. Deploy (Anchor) Organization [Aux] |                                       |
          | 4. Deploy Anchor & set co-anchor      |                                       |
          |    address. [Aux]                     |                                       |
          | 5. Set Co-Anchor address [Orig]       |                                       |
          |---------------------------------------|---------------------------------------|
          |                               D. Deploy Libs                                  |
          |---------------------------------------|---------------------------------------|
          | 1. Deply MerklePatriciaProof [Both]   | 1. Deply MerklePatriciaProof [Both]   |
          | 2. Deploy MessageBus [Both]           | 2. Deploy MessageBus [Both]           |
          | 3. Deploy GatewayLib [Both]           | 3. Deploy GatewayLib [Both]           |
          |---------------------------------------|---------------------------------------|
          |                             E.  Deploy Gateways                               |
          |---------------------------------------|---------------------------------------|
          | 1. Deploy Gateway [Orig]              | 1. Deploy Gateway [Orig]              |
          | 2. Deploy Cogateway [Aux]             | 2. Deploy Cogateway [Aux]             |
          | 3. Activate Gateway [Orig]            | 3. Activate Gateway [Orig]            |
          |---------------------------------------|---------------------------------------|
    */
  }
}

module.exports = EconomySetup;
