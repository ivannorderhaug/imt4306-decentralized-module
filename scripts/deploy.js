const path = require("path");

// The main function that deploys contracts and performs necessary actions.
async function main() {
    // Deploy Token contract
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("Token deployed to:", tokenAddress);

    // Deploy Proposal contract
    const Proposal = await ethers.getContractFactory("Proposal");
    const proposal = await Proposal.deploy(tokenAddress);
    await proposal.waitForDeployment();
    const proposalAddress = await proposal.getAddress();
    console.log("Proposal deployed to:", proposalAddress);

    // Extract ABI for both contracts and save contract addresses
    extractABI("Token");
    extractABI("Proposal");
    saveContractAddress("Token", tokenAddress);
    saveContractAddress("Proposal", proposalAddress);
}

// Function to extract ABI of a contract and save it to a file
function extractABI(contractName) {
    const fs = require("fs");
    const contractPath = path.resolve(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
    
    // Check if contract file exists
    if (!fs.existsSync(contractPath)) {
        throw new Error("Contract not found");
    }

    // Read contract file and extract ABI
    const file = fs.readFileSync(contractPath);
    const json = JSON.parse(file);
    const abi = JSON.stringify(json.abi, null, 2);
    const abiPath = path.resolve(__dirname, `../abis/${contractName}.json`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(path.resolve(__dirname, "../abis"))) {
        fs.mkdirSync(path.resolve(__dirname, "../abis"));
    }

    // Write ABI to file
    fs.writeFileSync(abiPath, abi);
    console.log(`Extracted ABI for ${contractName} to ${abiPath}`);
}

// Function to save contract address to a JSON file
function saveContractAddress(contractName, address) {
    const fs = require("fs");
    const path = require("path");

    // Define path for contract addresses file
    let allAddressesPath = path.resolve(__dirname, "../contract-addresses.json");
    let allContracts = {};
    
    // Check if the contract addresses file exists
    if (fs.existsSync(allAddressesPath)) {
        const fileContent = fs.readFileSync(allAddressesPath, "utf-8");
        allContracts = JSON.parse(fileContent);
    }

    // Update contract addresses object with new address
    allContracts[contractName] = address;

    // Write updated object to the file
    fs.writeFileSync(allAddressesPath, JSON.stringify(allContracts, null, 2));

    console.log(`Saved address for ${contractName} to ${allAddressesPath}`);
}

// Execute the main function and handle errors
main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});
