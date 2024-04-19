const fs = require("fs");

task("free_eth", "Sends ETH and tokens to an address")
  .addPositionalParam("receiver", "The address that will receive them")
  .setAction(async ({ receiver }, { ethers }) => {
    if (network.name === "hardhat") {
      console.warn(
        "You are running the faucet task with Hardhat network, which" +
          "gets automatically created and destroyed every time. Use the Hardhat" +
          " option '--network localhost'"
      );
    }

    const [sender] = await ethers.getSigners();

    const senderAddress = await sender.getAddress();

    const tx2 = await sender.sendTransaction({
      to: receiver,
      value: ethers.parseEther("1000"),
    });
    await tx2.wait();

    console.log(`Transferred 1000 ETH from ${senderAddress} to ${receiver}`);
  });
