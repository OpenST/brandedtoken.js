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

/**
 * Generates ABI/BIN using truffle compiler.
 *
 * Steps to generate ABI/BIN:
 *
 * 1. Clone brandedtoken-contracts at same level of brandedtoken.js folder.
 * 2. Checkout develop or any branch of your liking.
 * 3. run: ./node_modules/.bin/truffle compile.
 * 4. Come back to brandedtoken.js/contracts.
 * 5. run: node ./generateAbiBins.js.
 * 6. Make sure commit only the contracts that are needed.
 */
const fs = require('fs');
const path = require('path');

let contractsRepoPath = path.join(__dirname, '../../brandedtoken-contracts/build/contracts/');
const abiOutputPath = path.join(__dirname, './abi');
const binOutputPath = path.join(__dirname, './bin');

if (process.argv.length > 2) {
  contractsRepoPath = process.argv[2];
}

console.log(`Looking for truffle compile output in path ${contractsRepoPath}`);

const metadata = {
  abi: {
    generated: [],
    ignored: [],
  },
  bin: {
    generated: [],
    ignored: [],
  },
  total: 0,
};

// Read all files.
fs.readdir(contractsRepoPath, (err, items) => {
  metadata.total = items.length;
  for (let i = 0; i < items.length; i++) {
    const fileName = items[i];
    if (!fileName.endsWith('.json')) {
      // Do nothing
      continue;
    }

    // Determine file Name
    const fileSplits = fileName.split('.');
    if (fileSplits.length > 2) {
      throw `Unexpected File Name ${fileName}`;
    }

    const contractName = fileSplits[0];

    if (contractName.startsWith('Mock') || contractName.startsWith('Test')) {
      // Skip it.
      metadata.abi.ignored.push(contractName);
      metadata.bin.ignored.push(contractName);
      continue;
    }

    console.log(`Processing ${fileName}`);

    const jsonFilePath = path.join(contractsRepoPath, fileName);
    console.log(`jsonFilePath ${jsonFilePath}`);
    const json = require(jsonFilePath);

    // Generate Abi files
    if (json.abi && json.abi.length) {
      console.log('--- Generating abi file');
      // Write to file.
      const fileContent = JSON.stringify(json.abi);
      const outputFile = path.join(abiOutputPath, `${contractName}.abi`);
      fs.writeFileSync(outputFile, fileContent);
      // Update Metadata
      metadata.abi.generated.push(contractName);
    } else {
      console.log('--- abi file not generated');
      metadata.abi.ignored.push(contractName);
    }

    // Generate Bin files
    if (json.bytecode && json.bytecode.length && json.bytecode !== '0x') {
      console.log('--- Generating bin file');
      // Write to file.
      const fileContent = json.bytecode;
      const outputFile = path.join(binOutputPath, `${contractName}.bin`);
      fs.writeFileSync(outputFile, fileContent);
      // Update Metadata
      metadata.bin.generated.push(contractName);
    } else {
      console.log('--- bin file not generated');
      metadata.bin.ignored.push(contractName);
    }
  }

  console.log('------ Task Completed ------');
  console.log('Total Trfuule Artifacts:', metadata.total);
  console.log(
    'Abi File generated for',
    metadata.abi.generated.length,
    'contracts. Artifacts can be found here: ',
    abiOutputPath,
  );
  console.log(
    'Bin generated for',
    metadata.bin.generated.length,
    'contracts. Artifacts can be found here: ',
    binOutputPath,
  );
  if (metadata.abi.ignored.length) {
    console.log('Abi generation ignored for \n\t', metadata.abi.ignored.join('\n\t '));
  }
  if (metadata.bin.ignored.length) {
    console.log('Bin generation ignored for \n\t', metadata.bin.ignored.join('\n\t '));
  }
});
