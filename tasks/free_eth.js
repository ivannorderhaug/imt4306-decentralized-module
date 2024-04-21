// Define a task named "free_eth" that sends ETH and tokens to an address
task("free_eth", "Sends ETH and tokens to an address")
  // Add a positional parameter for the receiver address
  .addPositionalParam("receiver", "The address that will receive them")
  // Set the action to be executed when the task is run
  .setAction(async ({ receiver }, { ethers }) => {
    // Get the signer (sender) account from ethers
    const [sender] = await ethers.getSigners();

    // Get the address of the sender account
    const senderAddress = await sender.getAddress();

    // Send a transaction to the receiver address with 1000 ETH
    const tx = await sender.sendTransaction({
      to: receiver,
      value: ethers.parseEther("1000"),
    });
    
    // Wait for the transaction
    await tx.wait();

    // Log a message indicating the successful transfer of ETH
    console.log(`Transferred 1000 ETH from ${senderAddress} to ${receiver}`);
  });
