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
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});