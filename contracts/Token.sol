// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

import "hardhat/console.sol";

contract Token {
    string public name = "Jonus Garh Stroe";
    string public symbol = "JGS";

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

    function faucet(uint256 _value) public {
        require(balances[owner] >= _value, "Insufficient balance");

        balances[owner] -= _value;
        balances[msg.sender] += _value;

        emit Transfer(owner, msg.sender, _value);
    }

    function mint(uint256 _value) public onlyOwner {
        balances[owner] += _value;
        totalSupply += _value;
    }
}
