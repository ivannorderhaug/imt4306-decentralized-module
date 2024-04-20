
const { spawn } = require('child_process');
let server;
let client;
let app;

server = spawn('npx', ['hardhat', 'node']);
console.log('Starting local node...');

setTimeout(() => {
    client = spawn('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost']);
    console.log('Deploying contracts...');
}, 5000);

setTimeout(() => {
    app = spawn('node', ['app.js']);
    console.log('Starting app...');

    app.stdout.on('data', (data) => {
        console.log(data.toString());
    });

}, 10000);

process.on('SIGINT', () => {
    server.kill();
    client.kill();
    app.kill();
    process.exit();
});
