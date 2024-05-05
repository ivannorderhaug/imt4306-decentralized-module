# IMT4306 Decentralized Module - dApp

This repository is a part of the portfolio for the decentralized systems module in IMT4306 - Introduction to Research in Decentralised Systems.

## Requirements

- [Node.js v20.12.2](https://nodejs.org/en)
- [MetaMask](https://metamask.io/) wallet  

## Usage
0. Manually add the local test network to your [MetaMask](https://metamask.io/) wallet by unlocking your wallet and navigating to Settings>Networks>Add Network. Then click on the text that says "Add a network manually", and input the following things:
```
Network name = Hardhat test network
New RPC Url = http://127.0.0.1:8545/
Chain ID = 1337
Currency symbol = ETH
``` 
1. Clone the repository
```bash
git clone git@github.com:ivannorderhaug/imt4306-decentralized-module.git
```
2. Navigate to the project folder
```bash
cd imt4306-decentralized-module
```
3. Install dependencies
```bash
npm i
```
4. Run the following command to start the server
```bash
node .
```
5. Access the frontend at [http://localhost:3000](http://localhost:3000), and connect your [MetaMask](https://metamask.io/) wallet.

6. Enjoy. (Want free ETH to interact with the dApp? Check out the additional commands.)

---
#### Additional commands:

- Run tests
```bash
npx hardhat test
```
- Get test coverage
```bash
npx hardhat coverage
```
- Get 1000 ETH for testing (Recommended to run if you want to interact with the running instance of the dApp)
```bash
npx hardhat --network localhost free_eth <your_metamask_wallet_address>
```
## Bugs
Should you encounter any bugs, like for example the balance not updating after swapping, try refreshing or do a new swap. Otherwise, stop the dApp instance from running. Unlock your [MetaMask](https://metamask.io/) wallet and go to Settings>Advanced and click on "Clear activity tab data", before rerunning Step 3. 

Note: Should you rerun the dApp instance, you need to rerun the free_eth task in additional commands and clear your activity tab data on MetaMask.
