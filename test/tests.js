const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Proposal and Token Contract", function () {
    let Proposal;
    let proposal;
    let Token;
    let token;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        Token = await ethers.getContractFactory("Token");
        token = await Token.deploy();
        await token.waitForDeployment();

        const tokenAddress = await token.getAddress();

        Proposal = await ethers.getContractFactory("Proposal");
        proposal = await Proposal.deploy(tokenAddress);
        await proposal.waitForDeployment();
    });

    it("Should return the right owner", async function () {
        expect(await proposal.owner()).to.equal(owner.address);
    });

    it("Should create a proposal", async function () {
        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 1000);
        
        const proposal1 = await proposal.getProject(0);
        expect(proposal1.title).to.equal("Proposal 1");
        expect(proposal1.description).to.equal("This is a proposal");
        expect(proposal1.targetAmount).to.equal(1000);
        expect(proposal1.currentAmount).to.equal(0);
        expect(proposal1.status).to.equal(0);
        expect(proposal1.owner).to.equal(addr1.address);

        const proposals = await proposal.getProjects();
        expect(proposals.length).to.equal(1);
    });

    it("Should update a proposal", async function () {
        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 1000);
        await proposal.connect(addr1).update(0, "Proposal 1 Updated", "This is an updated proposal", 2000);

        const proposal1 = await proposal.getProject(0);
        expect(proposal1.title).to.equal("Proposal 1 Updated");
        expect(proposal1.description).to.equal("This is an updated proposal");
        expect(proposal1.targetAmount).to.equal(2000);
    });

    it("Should fund a proposal", async function () {
        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 1000);
        
        const balanceBefore = await token.balanceOf(addr2.address);
        expect(balanceBefore).to.equal(0); 

        await token.connect(addr2).swap({value: ethers.parseEther("1")});
        
        const balanceAfter = await token.balanceOf(addr2.address);
        expect(balanceAfter).to.equal(1000);

        await proposal.connect(addr2).fund(0, 500);
    
        const proposal1 = await proposal.getProject(0);
        expect(proposal1.currentAmount).to.equal(500);

        const balanceAfterFunding = await token.balanceOf(addr2.address);
        expect(balanceAfterFunding).to.equal(500);
    
    });
    
    it("Should not fund a proposal if the new currentAmount will be larger than the targetAmount", async function () {
        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 1000);
        await token.connect(addr2).swap({value: ethers.parseEther("1")});

        const balanceBefore = await token.balanceOf(addr2.address);
        expect(balanceBefore).to.equal(1000);

        await proposal.connect(addr2).fund(0, 500);

        const proposal1 = await proposal.getProject(0);
        expect(proposal1.currentAmount).to.equal(500);

        await expect(proposal.connect(addr2).fund(0, 600)).to.be.revertedWith("Amount exceeds target amount");
    });
    
    it("Should revert when updating a non-existent project", async function () {
        await expect(proposal.connect(addr1).update(0, "Proposal 1 Updated", "This is an updated proposal", 2000)).to.be.revertedWith("Invalid project id");
    });
    
    it("Should revert when funding a non-existent project", async function () {
        await token.connect(addr2).swap({value: ethers.parseEther("1")});

        await expect(proposal.connect(addr1).fund(0, 500)).to.be.revertedWith("Invalid project id");
    });
    
    it("Should change project status to 'Completed' after reaching target amount", async function () {
        await token.connect(addr2).swap({value: ethers.parseEther("1")});

        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 1000);
        await proposal.connect(addr2).fund(0, 1000);

        const proposal1 = await proposal.getProject(0);
        expect(proposal1.status).to.equal(2);
    });
    
    it("Should revert when trying to update a project as non-owner", async function () {
        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 1000);
        await expect(proposal.connect(addr2).update(0, "Proposal 1 Updated", "This is an updated proposal", 2000)).to.be.revertedWith("Only owner can update project");
    });
    
    it("Should withdraw funds when project is completed", async function () {
        await token.connect(addr2).swap({value: ethers.parseEther("1")});

        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 1000);

        await proposal.connect(addr2).fund(0, 1000);

        await proposal.connect(addr1).withdraw(0);

        const tokenBalanceAfter = await token.balanceOf(addr1.address);
        expect(tokenBalanceAfter).to.not.equal(0);
    });

    it("Should revert when trying to withdraw funds more than once", async function () {
        await token.connect(addr2).swap({value: ethers.parseEther("1")});

        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 1000);

        await proposal.connect(addr2).fund(0, 1000);

        await proposal.connect(addr1).withdraw(0);

        await expect(proposal.connect(addr1).withdraw(0)).to.be.revertedWith("Project already withdrawn");

        const tokenBalanceAfter = await token.balanceOf(addr1.address);
        expect(tokenBalanceAfter).to.not.equal(0);
    });

    it("Should revert when trying to withdraw funds from a non-completed project", async function () {
        await token.connect(addr2).swap({value: ethers.parseEther("1")});

        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 1000);

        await proposal.connect(addr2).fund(0, 500);

        await expect(proposal.connect(addr1).withdraw(0)).to.be.revertedWith("Project is not completed");

        const tokenBalanceAfter = await token.balanceOf(addr1.address);
        expect(tokenBalanceAfter).to.equal(0);
    });

    
    it("Should emit correct events", async function () {
        await expect(proposal.connect(addr1).create("Proposal 1", "This is a proposal", 1000))
            .to.emit(proposal, "Created")
            .withArgs(addr1.address, "Proposal 1", "This is a proposal", 1000, 0, 0);

        await proposal.connect(addr1).create("Proposal 2", "This is another proposal", 2000);
        await expect(proposal.connect(addr1).update(1, "Proposal 2 Updated", "This is an updated proposal", 2500))
            .to.emit(proposal, "Updated")
            .withArgs(addr1.address, "Proposal 2 Updated", "This is an updated proposal", 2500);

        await proposal.connect(addr2).create("Proposal 3", "This is yet another proposal", 3000);
        
        await expect(token.connect(addr2).swap({value: ethers.parseEther("1")}))
            .to.emit(token, "Transfer")
            .withArgs(await token.owner(), addr2.address, 1000);

        await expect(proposal.connect(addr2).fund(2, 500))
            .to.emit(proposal, "Funded")
            .withArgs(addr2.address, 2, 500);
    });

    it("Should mint tokens", async function () {
        const balanceBefore = await token.balanceOf(owner.address);
        expect(balanceBefore).to.equal(1000000);
        await token.connect(owner).mint(1000);
        const balanceAfter = await token.balanceOf(owner.address);
        expect(balanceAfter).to.equal(1001000);

        expect(balanceAfter).to.not.equal(balanceBefore);
    });

    it("Should revert when minting tokens as non-owner", async function () {
        await expect(token.connect(addr1).mint(1000)).to.be.revertedWith("Only owner can call this function");
    });
});
