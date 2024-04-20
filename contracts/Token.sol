// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

import "hardhat/console.sol";

contract Token {
    string public name = "PEPE Coin";
    string public symbol = "PEPE";

    uint256 public totalSupply = 1000000;

    address public owner;

    mapping(address => uint256) public balances;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor() {
        owner = msg.sender;
        balances[owner] = totalSupply;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value, "Insufficient balance");
        require(_to != address(0), "Invalid address");

        balances[msg.sender] -= _value;
        balances[_to] += _value;

        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(balances[_from] >= _value, "Insufficient balance");
        require(balances[_to] + _value >= balances[_to], "Invalid balance");

        balances[_from] -= _value;
        balances[_to] += _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    function swap() public payable {
        require(msg.value > 0.001 ether, "Amount to small");
        uint256 tokenAmount = (msg.value/1000000000000000);

        require(balances[owner] >= tokenAmount, "Insufficient token balance in contract");

        balances[owner] -= tokenAmount;
        balances[msg.sender] += tokenAmount;

        emit Transfer(owner, msg.sender, tokenAmount);
    }


    function mint(uint256 _value) public onlyOwner {
        balances[owner] += _value;
        totalSupply += _value;
    }
}
