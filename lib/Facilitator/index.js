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
const GatewayComposer = require('../ContractInteract/GatewayComposer');
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
    this.originWeb3 = originWeb3;
    this.valueToken = valueToken;
    this.gatewayComposer = gatewayComposer;
    this.brandedToken = brandedToken;
    this.facilitator = facilitator;

    this.gatewayComposer = new GatewayComposer(originWeb3, gatewayComposer);
    this.valueToken = new Mosaic.ContractInteract.EIP20Token(originWeb3, valueToken);
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
   * @param hashLock HashLock of facilitator.
   * @param txOptions - Tx options.
   */
  async acceptStakeRequest(
    stakeRequestHash,
    signature,
    bountyInWei,
    hashLock,
    txOptions,
  ) {
    const oThis = this;

    const approveForBountyReceipt = await this.valueToken.approve(
      oThis.gatewayComposer,
      bountyInWei,
      txOptions,
    );

    console.log('approveForBounty status:', approveForBountyReceipt.status);

    const acceptStakeRequestReceipt = await this.gatewayComposer.acceptStakeRequest(
      stakeRequestHash,
      signature.r,
      signature.s,
      signature.v,
      hashLock,
      txOptions,
    );

    console.log('acceptStakeRequest status:', acceptStakeRequestReceipt.status);
  }
}

module.exports = Facilitator;
