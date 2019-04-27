
'use strict';

const Compute = require('@google-cloud/compute');
const http = require('http');

const compute = new Compute();

const zone = compute.zone('us-central1-a');

// Create a new VM, using default ubuntu image. The startup script
// installs Node and starts a Node server.
const config = {
  os: 'ubuntu',
  http: true,
  metadata: {
    items: [
      {
        key: 'startup-script',
        value: `#! /bin/bash
        # Get Node version manager and install Node 8.
        curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.9/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
        nvm install 8
        # Install git
        apt-get --assume-yes install git
        # Clone sample application and start it.
        git clone https://github.com/fhinkel/nodejs-hello-world.git
        cd nodejs-hello-world
        npm start &`
      },
    ],
  },
};

const vm = zone.vm('vm-with-node-server');

(async () => {
  try {
    const data = await vm.create(config);
    const operation = data[1];
    await operation.promise();

    // External IP of the VM.
    const metadata = await vm.getMetadata();
    const ip = metadata[0].networkInterfaces[0].accessConfigs[0].natIP;
    console.log(`Booting new VM with IP http://${ip}...`);

    // Ping the VM to determine when the HTTP server is ready.
    let waiting = true;
    const timer = setInterval(
      ip => {
        http
          .get('http://' + ip, res => {
            const statusCode = res.statusCode;
            if (statusCode === 200 && waiting) {
              waiting = false;
              clearTimeout(timer);
              // HTTP server is ready.
              console.log('Ready!');
              console.log(ip);
            }
          })
          .on('error', () => {
            // HTTP server is not ready yet.
            process.stdout.write('.');
          });
      },
      2000,
      ip
    );
  }
  catch (error) {
    console.error(error);
  }
})();
