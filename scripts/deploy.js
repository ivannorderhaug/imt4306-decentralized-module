const path = require("path");

async function main() {
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();
    await token.waitForDeployment();

    const tokenAddress = await token.getAddress();
    
    console.log("Token deployed to:", tokenAddress);

    const Proposal = await ethers.getContractFactory("Proposal");
    const proposal = await Proposal.deploy(tokenAddress);
    await proposal.waitForDeployment();

    const proposalAddress = await proposal.getAddress();

    console.log("Proposal deployed to:", proposalAddress);

    extractABI("Token");
    extractABI("Proposal");

    saveContractAddress("Token", tokenAddress);
    saveContractAddress("Proposal", proposalAddress);
}

function extractABI(contractName) {
    const fs = require("fs");
    const contractPath = path.resolve(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
    
    if (!fs.existsSync(contractPath)) {
        throw new Error("Contract not found");
    }

    const file = fs.readFileSync(contractPath);
    const json = JSON.parse(file);

    const abi = JSON.stringify(json.abi, null, 2);
    const abiPath = path.resolve(__dirname, `../abis/${contractName}.json`);
    if (!fs.existsSync(path.resolve(__dirname, "../abis"))) {
        fs.mkdirSync(path.resolve(__dirname, "../abis"));
    }

    fs.writeFileSync(abiPath, abi);

    console.log(`Extracted ABI for ${contractName} to ${abiPath}`);
}

function saveContractAddress(contractName, address) {
    const fs = require("fs");
    const path = require("path");

    let allAddressesPath = path.resolve(__dirname, "../contract-addresses.json");
    let allContracts = {};
    
    if (fs.existsSync(allAddressesPath)) {
        const fileContent = fs.readFileSync(allAddressesPath, "utf-8");
        allContracts = JSON.parse(fileContent);
    }

    allContracts[contractName] = address;

    fs.writeFileSync(allAddressesPath, JSON.stringify(allContracts, null, 2));

    console.log(`Saved address for ${contractName} to ${allAddressesPath}`);
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});