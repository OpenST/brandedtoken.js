// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

'use strict';

const Mosaic = require('@openstfoundation/mosaic.js');

const AbiBinProvider = require('./lib/AbiBinProvider');
const BrandedToken = require('./lib/ContractInteract/BrandedToken');
const Contracts = require('./lib/Contracts');
const EconomySetup = require('./lib/EconomySetup');
const Facilitator = require('./lib/Facilitator');
const GatewayComposer = require('./lib/ContractInteract/GatewayComposer');
const StakeHelper = require('./lib/helpers/stake/gateway_composer/StakeHelper');
const Staker = require('./lib/Staker');
const UtilityBrandedToken = require('./lib/ContractInteract/UtilityBrandedToken');

const mosaicContractInteracts = Mosaic.ContractInteract;

module.exports = {
  AbiBinProvider,
  EconomySetup,
  Contracts,
  ContractInteract: {
    BrandedToken,
    GatewayComposer,
    UtilityBrandedToken,
    ...mosaicContractInteracts,
  },
  Helpers: {
    StakeHelper,
    Staker,
    Facilitator,
  },
};
