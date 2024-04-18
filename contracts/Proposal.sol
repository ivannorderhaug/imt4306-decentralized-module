// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

import "hardhat/console.sol";

import "./Token.sol";

contract Proposal {
    address public owner;
    uint public projectCount;
    mapping(uint => Project) public projects;
    mapping(uint => Funder[]) public funders;

    Token public token;

    event Created(address owner, string title, string description, uint targetAmount, uint currentAmount, Status status);
    event Updated(address owner, string title, string description, uint targetAmount);
    event Funded(address funder, uint projectId, uint amount);
    event Refunded(address owner, uint projectId, uint amount);
    event Withdrawn(address owner, uint projectId, uint amount);

    enum Status {
        Ongoing,
        Cancelled,
        Completed
    }

    struct Project {
        address owner;
        string title;
        string description;
        uint targetAmount;
        uint currentAmount;
        bool withdrawn;
        Status status;
    }

    struct Funder {
        address funder;
        uint projectId;
        uint amount;
    }

    constructor(address _token) {
        owner = msg.sender;
        token = Token(_token);
    }

    function create(string memory _title, string memory _description, uint _targetAmount) public {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_targetAmount > 0, "Target amount must be greater than 0");

        Project memory newProject = Project({
            owner: msg.sender,
            title: _title,
            description: _description,
            targetAmount: _targetAmount,
            currentAmount: 0,
            withdrawn: false,
            status: Status.Ongoing
        });

        projects[projectCount] = newProject;
        projectCount++;

        console.log("Project created by %s", msg.sender);
        emit Created(msg.sender, _title, _description, _targetAmount, 0, Status.Ongoing);
    }

    function update(uint _id, string memory _title, string memory _description, uint _targetAmount) public{
        require(_id < projectCount, "Invalid project id");
        require(msg.sender == projects[_id].owner, "Only owner can update project");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_targetAmount > 0, "Target amount must be greater than 0");
        require(projects[_id].status == Status.Ongoing, "Status must be ongoing");

        Project storage project = projects[_id];
        project.title = _title;
        project.description = _description;
        project.targetAmount = _targetAmount;

        console.log("Project updated by %s", msg.sender);
        emit Updated(msg.sender, _title, _description, _targetAmount);
    }

    function getProject(uint _id) public view returns (Project memory) {
        require(_id < projectCount, "Invalid project id");
        return projects[_id];
    }

    function getProjects() public view returns (Project[] memory) {
        Project[] memory _projects = new Project[](projectCount);
        for (uint i = 0; i < projectCount; i++) {
            _projects[i] = projects[i];
        }
        return _projects;
    }

    function getFunders(uint _projectId) public view returns (Funder[] memory) {
        require(_projectId < projectCount, "Invalid project id");
        return funders[_projectId];
    }

    function fund(uint _projectId, uint _amount) public {
        require(_projectId < projectCount, "Invalid project id");
        require(_amount > 0, "Amount must be greater than 0");
        require(projects[_projectId].status == Status.Ongoing, "Project is not ongoing");
        require(_amount + projects[_projectId].currentAmount <= projects[_projectId].targetAmount, "Amount exceeds target amount");

        token.transferFrom(msg.sender, address(this), _amount);

        Funder memory newFunder = Funder({
            funder: msg.sender,
            projectId: _projectId,
            amount: _amount
        });

        funders[_projectId].push(newFunder);

        Project storage project = projects[_projectId];
        project.currentAmount += _amount;

        if (project.currentAmount == project.targetAmount) {
            project.status = Status.Completed;
        }

        console.log("Project funded by %s", msg.sender);
        emit Funded(msg.sender, _projectId, _amount);
    }

    function refund(uint _projectId) public {
        require(_projectId < projectCount, "Invalid project id");
        require(projects[_projectId].owner == msg.sender, "Only owner can refund");
        require(projects[_projectId].status == Status.Ongoing, "Project is not ongoing");

        Funder[] storage _funders = funders[_projectId];
        for (uint i = 0; i < _funders.length; i++) {
            token.transfer(_funders[i].funder, _funders[i].amount);
        }

        projects[_projectId].currentAmount = 0;
        projects[_projectId].status = Status.Cancelled;
        delete funders[_projectId];

        console.log("Project refunded by %s", msg.sender);
        emit Refunded(msg.sender, _projectId, projects[_projectId].currentAmount);
    }

    function withdraw(uint _projectId) public {
        require(_projectId < projectCount, "Invalid project id");
        require(projects[_projectId].owner == msg.sender, "Only owner can withdraw");
        require(projects[_projectId].status == Status.Completed, "Project is not completed");
        require(projects[_projectId].withdrawn == false, "Project already withdrawn");

        token.transfer(msg.sender, projects[_projectId].currentAmount);
        projects[_projectId].withdrawn = true;

        console.log("Project withdrawn by %s", msg.sender);
        emit Withdrawn(msg.sender, _projectId, projects[_projectId].currentAmount);
    }
}