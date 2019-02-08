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

const ConfigReader = function constructor() {};

ConfigReader.prototype = {
  gasPrice: '0x3B9ACA00',
  gas: 7500000,
  nullBytes32: '0x0000000000000000000000000000000000000000000000000000000000000000',
  originPort: 8546,
  stakeAmountInWei: '200',
  stakeGasPrice: '7500000',
  stakeGasLimit: '100',
};

module.exports = new ConfigReader();
