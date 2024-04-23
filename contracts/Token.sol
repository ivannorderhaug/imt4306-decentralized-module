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
    uint8 public decimals = 0;

    // Total token supply
    uint256 public totalSupply = 1000000000 * (10 ** uint256(decimals));

    // Owner of the contract
    address public owner;

    // Balances mapping to track token balances of addresses
    mapping(address => uint256) public balances;
    // Allowances mapping to track approved spending
    mapping(address => mapping(address => uint256)) public allowances;
    // Transfer event for tracking token transfers
    event Transfer(address indexed from, address indexed to, uint256 value);
    // Approval event for tracking approved spending
    event Approval(address indexed owner, address indexed spender, uint256 value);

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
    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowances[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    // Function to transfer tokens from one address to another
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(balances[_from] >= _value, "Insufficient balance");
        require(allowances[_from][msg.sender] >= _value, "Not enough allowance");
        require(_to != address(0), "Invalid address");

        balances[_from] -= _value;
        balances[_to] += _value;
        allowances[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

    // Function to retrieve the token balance of a specified address
    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    // Function to retrieve allowance of a spender for an owner's tokens
    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowances[_owner][_spender];
    }

    /** 
     * Helper function to allow one-way swapping Ether for tokens, definitely not a rug pull ;)
     * @dev Swaps Ether for tokens at a fixed rate of 1 ETH = 10^5 PEPE
     */ 
    function swap() public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        uint256 tokenAmount = msg.value * 10**uint256(5) / 1 ether; // Convert Wei to token amount

        require(balances[owner] >= tokenAmount, "Insufficient token balance in contract");

        balances[owner] -= tokenAmount;
        balances[msg.sender] += tokenAmount;

        emit Transfer(owner, msg.sender, tokenAmount);
    }
}
