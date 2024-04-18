async function main() {
    const Proposal = await ethers.getContractFactory("Proposal");
    const proposal = await Proposal.deploy();
    await proposal.waitForDeployment();

    const proposalAddress = await proposal.getAddress();

    console.log("Proposal deployed to:", proposalAddress);
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});