const express = require('express');
const fs = require('fs');
const proposalAbi = require('./abis/Proposal.json');
const tokenAbi = require('./abis/Token.json');

const app = express();
app.use(express.json());
const port = 3000;

app.get('/proposal', async (req, res) => {
    const address = getAddress('Proposal');
    if (!address) {
        res.status(404).send('Contract address not found');
        return;
    }
    res.send({
        address: address,
        abi: proposalAbi,
    });
});

app.get('/token', async (req, res) => {
    const address = getAddress('Token');
    if (!address) {
        res.status(404).send('Contract address not found');
        return;
    }
    res.send({
        address: address,
        abi: tokenAbi,
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/frontend/index.html');
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});

function getAddress(contract) {
    let addresses = {};
    if (fs.existsSync('contract-addresses.json')) {
        addresses = JSON.parse(fs.readFileSync('contract-addresses.json'));

        if (contract in addresses) {
            return addresses[contract];
        }
    }
}