// SPDX-License-Identifier: SEE LICENSE IN LICENSE

// Solidity version pragma
pragma solidity ^0.8.24;

// Importing console.sol for debugging purposes
import "hardhat/console.sol";

// Token contract definition
contract Token {
    // Token metadata
    string public name = "PEPE Coin";
    string public symbol = "PEPE";
    
    // Total token supply
    uint256 public totalSupply = 1000000;

    // Owner of the contract
    address public owner;

    // Balances mapping to track token balances of addresses
    mapping(address => uint256) public balances;

    // Transfer event for tracking token transfers
    event Transfer(address indexed from, address indexed to, uint256 value);

    // Constructor to initialize contract with initial supply and set owner
    constructor() {
        owner = msg.sender;
        balances[owner] = totalSupply;
    }

    // Modifier to restrict function access to the owner
    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Function to transfer tokens to a specified address
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value, "Insufficient balance");
        require(_to != address(0), "Invalid address");

        balances[msg.sender] -= _value;
        balances[_to] += _value;

        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    // Function to allow another address to spend tokens on behalf of the sender
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(balances[_from] >= _value, "Insufficient balance");
        require(balances[_to] + _value >= balances[_to], "Invalid balance");

        balances[_from] -= _value;
        balances[_to] += _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

    // Function to retrieve the token balance of a specified address
    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    // Function to allow one-way swapping Ether for tokens, definitely not a rug pull ;)
    function swap() public payable {
        require(msg.value > 0.001 ether, "Amount too small");
        uint256 tokenAmount = (msg.value / 1000000000000000); // Convert Wei to token amount

        require(balances[owner] >= tokenAmount, "Insufficient token balance in contract");

        balances[owner] -= tokenAmount;
        balances[msg.sender] += tokenAmount;

        emit Transfer(owner, msg.sender, tokenAmount);
    }

    // Function to mint new tokens (only callable by the owner), infinite money glitch
    function mint(uint256 _value) public onlyOwner {
        balances[owner] += _value;
        totalSupply += _value;
    }
}
