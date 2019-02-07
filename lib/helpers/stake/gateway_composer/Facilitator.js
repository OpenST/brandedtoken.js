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

const StakeHelper = require('./StakeHelper');

/**
 * Facilitator performs below tasks:
 * - approves bounty amount to GatewayComposer
 * - calls GatewayComposer.acceptStakeRequest
 */
class Facilitator {
  /**
   * Facilitator constructor object.
   *
   * @param originWeb3 Origin chain web3 address.
   * @param valueToken Value token contract address.
   * @param brandedToken Branded Token contract address.
   * @param gatewayComposer Gateway composer contract address.
   * @param facilitator Facilitator address.
   */
  constructor(originWeb3, valueToken, brandedToken, gatewayComposer, facilitator) {
    const oThis = this;

    oThis.originWeb3 = originWeb3;
    oThis.valueToken = valueToken;
    oThis.gatewayComposer = gatewayComposer;
    oThis.brandedToken = brandedToken;
    oThis.facilitator = facilitator;
  }

  /**
   * Facilitator performs below tasks:
   * - approves bounty amount to GatewayComposer
   * - calls GatewayComposer.acceptStakeRequest
   *
   * Note: Add KYC worker account/private key in web3 wallet before calling acceptStakeRequest.
   *
   * @param stakeRequestHash Stake request hash unique for each stake.
   * @param signature Signature object format:
   *                  {
   *                    messageHash: signHash,
   *                    v: vrs[0],
   *                    r: vrs[1],
   *                    s: vrs[2],
   *                    signature: signature
   *                  }
   * @param bountyInWei Bounty amount in wei's that needs to be approved.
   * @param valueTokenAbi ValueToken contract ABI.
   * @param hashLock HashLock of facilitator.
   * @param originWeb3 Origin chain web3 object.
   * @param txOptions - Tx options.
   */
  async acceptStakeRequest(
    stakeRequestHash,
    signature,
    bountyInWei,
    valueTokenAbi,
    hashLock,
    originWeb3,
    txOptions,
  ) {
    const oThis = this;

    const stakeHelperInstance = new StakeHelper(
      oThis.originWeb3,
      oThis.brandedToken,
      oThis.gatewayComposer,
    );
    await stakeHelperInstance.approveForBounty(
      oThis.facilitator,
      bountyInWei,
      oThis.valueToken,
      valueTokenAbi,
      originWeb3,
    ).then((receipt) => {
      console.log('receipt for approveForBounty', receipt);
    });
    await stakeHelperInstance.acceptStakeRequest(
      stakeRequestHash,
      signature,
      oThis.facilitator,
      hashLock,
      oThis.originWeb3,
      txOptions,
    ).then((receipt) => {
      console.log('receipt for acceptStakeRequest', receipt);
    });
  }
}

module.exports = Facilitator;
