// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

// Importing console.sol for debugging purposes
import "hardhat/console.sol";

// Importing Token.sol contract
import "./Token.sol";

contract Proposal {
    // State variables
    address public owner;
    uint public projectCount;
    mapping(uint => Project) public projects;

    // Token contract reference
    Token public token;

    // Events for contract actions
    event Created(address owner, string title, string description, uint targetAmount, uint currentAmount, Status status);
    event Updated(address owner, uint projectId, string title, string description, uint targetAmount);
    event Funded(address funder, uint projectId, uint amount);
    event Withdrawn(address owner, uint projectId, uint amount);

    // Enum to represent project status
    enum Status {
        Ongoing,
        Cancelled,
        Completed
    }

    // Struct to represent a project
    struct Project {
        address owner;
        string title;
        string description;
        uint targetAmount;
        uint currentAmount;
        bool withdrawn;
        Status status;
    }

    // Constructor to initialize the contract with a token address
    constructor(address _token) {
        owner = msg.sender;
        token = Token(_token);
    }

    // Function to create a new project proposal
    function create(string memory _title, string memory _description, uint _targetAmount) public {
        // Input validations
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_targetAmount > 0, "Target amount must be greater than 0");

        // Create new project
        Project memory newProject = Project({
            owner: msg.sender,
            title: _title,
            description: _description,
            targetAmount: _targetAmount,
            currentAmount: 0,
            withdrawn: false,
            status: Status.Ongoing
        });

        // Store project and emit event
        projects[projectCount] = newProject;
        projectCount++;

        console.log("Project created by %s", msg.sender);
        emit Created(msg.sender, _title, _description, _targetAmount, 0, Status.Ongoing);
    }

    // Function to update an existing project proposal
    function update(uint _id, string memory _title, string memory _description, uint _targetAmount) public{
        // Input validations
        require(_id < projectCount, "Invalid project id");
        require(msg.sender == projects[_id].owner, "Only owner can update project");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_targetAmount > 0, "Target amount must be greater than 0");
        require(projects[_id].status == Status.Ongoing, "Status must be ongoing");

        // Update project details and emit event
        Project storage project = projects[_id];
        project.title = _title;
        project.description = _description;
        project.targetAmount = _targetAmount;
        if (_targetAmount <= project.currentAmount) {
            project.status = Status.Completed;
        }

        console.log("Project updated by %s", msg.sender);
        emit Updated(msg.sender, _id, _title, _description, _targetAmount);
    }

    // Function to retrieve all projects
    function getProjects() public view returns (Project[] memory) {
        // Initialize array to store projects
        Project[] memory _projects = new Project[](projectCount);
        // Iterate over projects and store in array
        for (uint i = 0; i < projectCount; i++) {
            _projects[i] = projects[i];
        }
        return _projects;
    }

    // Function to fund a project
    function fund(uint _projectId, uint _amount) public {
        // Input validations
        require(_projectId < projectCount, "Invalid project id");
        require(_amount > 0, "Amount must be greater than 0");
        require(projects[_projectId].status == Status.Ongoing, "Project is not ongoing");
        require(_amount + projects[_projectId].currentAmount <= projects[_projectId].targetAmount, "Amount exceeds target amount");

        // Transfer tokens from sender to contract
        require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");

        // Update project current amount and status, emit event
        Project storage project = projects[_projectId];
        project.currentAmount += _amount;
        if (project.currentAmount == project.targetAmount) {
            project.status = Status.Completed;
        }

        console.log("Project funded by %s", msg.sender);
        emit Funded(msg.sender, _projectId, _amount);
    }

    // Function to withdraw funds from a completed project
    function withdraw(uint _projectId) public {
        // Input validations
        require(_projectId < projectCount, "Invalid project id");
        require(projects[_projectId].owner == msg.sender, "Only owner can withdraw");
        require(projects[_projectId].status == Status.Completed, "Project is not completed");
        require(projects[_projectId].withdrawn == false, "Project already withdrawn");

        // Transfer tokens to project owner and mark project as withdrawn, emit event
        require(token.transfer(msg.sender, projects[_projectId].currentAmount), "Token transfer failed");
        projects[_projectId].withdrawn = true;

        console.log("Project withdrawn by %s", msg.sender);
        emit Withdrawn(msg.sender, _projectId, projects[_projectId].currentAmount);
    }
}
