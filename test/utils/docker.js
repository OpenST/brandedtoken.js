const childProcess = require('child_process');
const path = require('path');
const waitPort = require('wait-port');

const composeFilePath = path.join(__dirname, './docker-compose.yml');

const asyncSleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const dockerSetup = () => {
  const dockerCompose = childProcess.spawn('docker-compose', ['-f', composeFilePath, 'up', '--force-recreate']);

  if (process.env.TEST_STDOUT) {
    dockerCompose.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    dockerCompose.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  }

  const originPort = 8546;

  const waitForOriginNode = waitPort({ port: originPort, output: 'silent' });
  return Promise.all([waitForOriginNode])
    .then(() => {
      // even after the port is available, the node needs a bit of time to get online
      return asyncSleep(5000);
    })
    .then(() => ({
      rpcEndpointOrigin: `http://localhost:${originPort}`
    }));
};

const dockerTeardown = () => {
  const dockerComposeDown = childProcess.spawnSync('docker-compose', ['-f', composeFilePath, 'down']);
  if (process.env.TEST_STDOUT) {
    process.stdout.write(dockerComposeDown.stdout);
    process.stderr.write(dockerComposeDown.stderr);
  }
};

module.exports = {
  asyncSleep,
  dockerSetup,
  dockerTeardown
};
