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
        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 50000); // 0.5 ETH
        
        const proposal1 = await proposal.projects(0);
        expect(proposal1.title).to.equal("Proposal 1");
        expect(proposal1.description).to.equal("This is a proposal");
        expect(proposal1.targetAmount).to.equal(50000); // 0.5 ETH
        expect(proposal1.currentAmount).to.equal(0);
        expect(proposal1.status).to.equal(0);
        expect(proposal1.owner).to.equal(addr1.address);

        const proposals = await proposal.getProjects();
        expect(proposals.length).to.equal(1);
    });

    it("Should update a proposal", async function () {
        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 50000); // 0.5 ETH
        await proposal.connect(addr1).update(0, "Proposal 1 Updated", "This is an updated proposal", 100000); // 1 ETH

        const proposal1 = await proposal.projects(0);
        expect(proposal1.title).to.equal("Proposal 1 Updated");
        expect(proposal1.description).to.equal("This is an updated proposal");
        expect(proposal1.targetAmount).to.equal(100000);
    });

    it("Should fund a proposal", async function () {
        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 50000);
        
        const balanceBefore = await token.balanceOf(addr2.address);
        expect(balanceBefore).to.equal(0); 

        await token.connect(addr2).swap({value: ethers.parseEther("1")});
        
        const balanceAfter = await token.balanceOf(addr2.address);
        expect(balanceAfter).to.equal(100000);

        let proposalAddress = await proposal.getAddress();

        await token.connect(addr2).approve(proposalAddress, 50000);

        await proposal.connect(addr2).fund(0, 50000);
    
        const proposal1 = await proposal.projects(0);
        expect(proposal1.currentAmount).to.equal(50000);

        const balanceAfterFunding = await token.balanceOf(addr2.address);
        expect(balanceAfterFunding).to.equal(50000);
    
    });
    
    it("Should not fund a proposal if the new currentAmount will be larger than the targetAmount", async function () {
        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 50000);
        await token.connect(addr2).swap({value: ethers.parseEther("1")});

        const balanceBefore = await token.balanceOf(addr2.address);
        expect(balanceBefore).to.equal(100000);

        let proposalAddress = await proposal.getAddress();

        await token.connect(addr2).approve(proposalAddress, 60000);

        await proposal.connect(addr2).fund(0, 25000);

        const proposal1 = await proposal.projects(0);
        expect(proposal1.currentAmount).to.equal(25000);

        await expect(proposal.connect(addr2).fund(0, 35000)).to.be.revertedWith("Amount exceeds target amount");
    });
    
    it("Should revert when updating a non-existent project", async function () {
        await expect(proposal.connect(addr1).update(0, "Proposal 1 Updated", "This is an updated proposal", 50000)).to.be.revertedWith("Invalid project id");
    });
    
    it("Should revert when funding a non-existent project", async function () {
        await token.connect(addr2).swap({value: ethers.parseEther("1")});
        
        let proposalAddress = await proposal.getAddress();

        await token.connect(addr2).approve(proposalAddress, 50000);

        await expect(proposal.connect(addr1).fund(0, 50000)).to.be.revertedWith("Invalid project id");
    });
    
    it("Should change project status to 'Completed' after reaching target amount", async function () {
        await token.connect(addr2).swap({value: ethers.parseEther("1")});

        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 10000); // 0.1 ETH

        let proposalAddress = await proposal.getAddress();

        await token.connect(addr2).approve(proposalAddress, 10000);

        await proposal.connect(addr2).fund(0, 10000);

        const proposal1 = await proposal.projects(0);
        expect(proposal1.status).to.equal(2);
    });
    
    it("Should revert when trying to update a project as non-owner", async function () {
        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 10000);
        await expect(proposal.connect(addr2).update(0, "Proposal 1 Updated", "This is an updated proposal", 20000)).to.be.revertedWith("Only owner can update project");
    });
    
    it("Should withdraw funds when project is completed", async function () {
        await token.connect(addr2).swap({value: ethers.parseEther("1")});

        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 10000);

        let proposalAddress = await proposal.getAddress();

        await token.connect(addr2).approve(proposalAddress, 10000);

        await proposal.connect(addr2).fund(0, 10000);

        await proposal.connect(addr1).withdraw(0);

        const tokenBalanceAfter = await token.balanceOf(addr1.address);
        expect(tokenBalanceAfter).to.not.equal(0);
    });

    it("Should revert when trying to withdraw funds more than once", async function () {
        await token.connect(addr2).swap({value: ethers.parseEther("1")});

        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 10000);

        let proposalAddress = await proposal.getAddress();

        await token.connect(addr2).approve(proposalAddress, 10000);

        await proposal.connect(addr2).fund(0, 10000);

        await proposal.connect(addr1).withdraw(0);

        await expect(proposal.connect(addr1).withdraw(0)).to.be.revertedWith("Project already withdrawn");

        const tokenBalanceAfter = await token.balanceOf(addr1.address);
        expect(tokenBalanceAfter).to.not.equal(0);
    });

    it("Should revert when trying to withdraw funds from a non-completed project", async function () {
        await token.connect(addr2).swap({value: ethers.parseEther("1")});

        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 10000);

        let proposalAddress = await proposal.getAddress();

        await token.connect(addr2).approve(proposalAddress, 10000);

        await proposal.connect(addr2).fund(0, 5000);

        await expect(proposal.connect(addr1).withdraw(0)).to.be.revertedWith("Project is not completed");

        const tokenBalanceAfter = await token.balanceOf(addr1.address);
        expect(tokenBalanceAfter).to.equal(0);
    });

    
    it("Should emit correct events", async function () {
        await expect(proposal.connect(addr1).create("Proposal 1", "This is a proposal", 50000))
            .to.emit(proposal, "Created")
            .withArgs(addr1.address, "Proposal 1", "This is a proposal", 50000, 0, 0);

        await proposal.connect(addr1).create("Proposal 2", "This is another proposal", 50000);
        await expect(proposal.connect(addr1).update(1, "Proposal 2 Updated", "This is an updated proposal", 55000))
            .to.emit(proposal, "Updated")
            .withArgs(addr1.address, 1, "Proposal 2 Updated", "This is an updated proposal", 55000);

        await proposal.connect(addr2).create("Proposal 3", "This is yet another proposal", 30000);
        
        await expect(token.connect(addr2).swap({value: ethers.parseEther("1")}))
            .to.emit(token, "Transfer")
            .withArgs(await token.owner(), addr2.address, 100000);

        let proposalAddress = await proposal.getAddress();

        await expect(token.connect(addr2).approve(proposalAddress, 30000))
            .to.emit(token, "Approval")
            .withArgs(addr2.address, proposalAddress, 30000);

        await expect(proposal.connect(addr2).fund(2, 30000))
            .to.emit(proposal, "Funded")
            .withArgs(addr2.address, 2, 30000);
    });

    it("Should revert when funding a project with insufficient token allowance", async function () {
        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 50000); // Create a project first
        await expect(proposal.connect(addr2).fund(0, 50000)).to.be.revertedWith("Insufficient balance");
    });

    it("Should revert when creating a project with zero target amount", async function () {
        await expect(proposal.connect(addr1).create("Proposal 1", "This is a proposal", 0))
            .to.be.revertedWith("Target amount must be greater than 0");
    });

    it("Should revert when updating a non-ongoing project", async function () {
        await proposal.connect(addr1).create("Proposal 1", "This is a proposal", 50000); // Create a project first

        await token.connect(addr2).swap({value: ethers.parseEther("1")});
        let proposalAddress = await proposal.getAddress();
        await token.connect(addr2).approve(proposalAddress, 50000);
        await proposal.connect(addr2).fund(0, 50000);
        await expect(proposal.connect(addr1).update(0, "Proposal 1 Updated", "This is an updated proposal", 100000))
            .to.be.revertedWith("Status must be ongoing");
    });

    it("Should revert when trying to withdraw funds from a non-existent project", async function () {
        await expect(proposal.connect(addr1).withdraw(0)).to.be.revertedWith("Invalid project id");
    });

    it("Should transfer tokens between addresses", async function () {
        await token.connect(addr1).swap({value: ethers.parseEther("1")});

        const balanceBeforeSender = await token.balanceOf(addr1.address);
        const balanceBeforeRecipient = await token.balanceOf(addr2.address);

        await token.connect(addr1).transfer(addr2.address, 10000);

        const balanceAfterSender = await token.balanceOf(addr1.address);
        const balanceAfterRecipient = await token.balanceOf(addr2.address);

        const expectedBalanceSender = balanceBeforeSender - 10000n;
        const expectedBalanceRecipient = balanceBeforeRecipient + 10000n;

        expect(balanceAfterSender).to.equal(expectedBalanceSender);
        expect(balanceAfterRecipient).to.equal(expectedBalanceRecipient);
    });

    it("Should revoke token approval", async function () {
        await token.connect(owner).approve(addr2.address, 5000);
        await token.connect(owner).approve(addr2.address, 0);

        const allowance = await token.allowance(owner.address, addr2.address);
        expect(allowance).to.equal(0);
    });

    it("Should approve spending allowance to another address", async function () {
        const amountToApprove = 5000n;
        await token.connect(owner).approve(addr1.address, amountToApprove);

        const allowance = await token.allowance(owner.address, addr1.address);
        expect(allowance).to.equal(amountToApprove);
    });

    it("Should revert when transferring tokens from an account with insufficient balance", async function () {
        const balance = await token.balanceOf(addr1.address);
        await expect(token.connect(addr1).transfer(addr2.address, balance + 1n)).to.be.revertedWith("Insufficient balance");
    });
});
