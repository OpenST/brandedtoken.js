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
   * @param {Web3} originWeb3 Origin chain web3 address.
   * @param {string} valueToken Value token contract address.
   * @param {string} brandedToken Branded Token contract address.
   * @param {string} gatewayComposer Gateway composer contract address.
   */
  constructor(originWeb3, valueToken, brandedToken, gatewayComposer) {
    this.originWeb3 = originWeb3;
    this.gatewayComposerAddress = gatewayComposer;
    this.brandedToken = brandedToken;

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
   * @param {string} stakeRequestHash Stake request hash unique for each stake.
   * @param {Object} signature Signature object format:
   *                  {
   *                    messageHash: signHash,
   *                    v: vrs[0],
   *                    r: vrs[1],
   *                    s: vrs[2],
   *                    signature: signature
   *                  }
   * @param {string} bountyInWei Bounty amount in wei's that needs to be
   *                             approved.
   * @param {string} hashLock HashLock of facilitator.
   * @param {Object} txOptions - Tx options.
   */
  async acceptStakeRequest(
    stakeRequestHash,
    signature,
    bountyInWei,
    hashLock,
    txOptions,
  ) {
    const approveForBountyReceipt = await this.valueToken.approve(
      this.gatewayComposerAddress,
      bountyInWei,
      txOptions,
    );

    let receipts = {
      approveForBountyReceipt,
    };
    console.log('approveForBounty status:', approveForBountyReceipt.status);

    if (!approveForBountyReceipt.status) {
      const err = new Error(
        `Approval for bounty is failed with transactionHash: ${approveForBountyReceipt.transactionHash}`,
      );
      return Promise.reject(err);
    }

    const acceptStakeRequestReceipt = await this.gatewayComposer.acceptStakeRequest(
      stakeRequestHash,
      signature.r,
      signature.s,
      signature.v,
      hashLock,
      txOptions,
    );

    console.log('acceptStakeRequest status:', acceptStakeRequestReceipt.status);

    if (!acceptStakeRequestReceipt.status) {
      const err = new Error(
        `Accept stake request failed with transactionHash: ${acceptStakeRequestReceipt.transactionHash}`,
      );
      return Promise.reject(err);
    }

    receipts = {
      acceptStakeRequestReceipt,
      ...receipts,
    };
    return receipts;
  }
}

module.exports = Facilitator;
