// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MedicalReportVerifier is Ownable {
    struct Report {
        string reportHash;
        string patientId;
        string labId;
        uint256 timestamp;
        bool exists;
    }

    mapping(string => Report) private reports;
    mapping(address => bool) public authorizedLabs;

    event ReportAdded(
        string indexed reportHash,
        string patientId,
        string labId,
        uint256 timestamp,
        address indexed submittedBy
    );

    event LabAuthorizationUpdated(address indexed lab, bool isAuthorized);

    constructor() Ownable(msg.sender) {}

    modifier onlyAuthorizedLab() {
        require(authorizedLabs[msg.sender] || owner() == msg.sender, "Caller is not an authorized lab");
        _;
    }

    function setLabAuthorization(address lab, bool isAuthorized) external onlyOwner {
        authorizedLabs[lab] = isAuthorized;
        emit LabAuthorizationUpdated(lab, isAuthorized);
    }

    function addReport(
        string memory reportHash,
        string memory patientId,
        string memory labId
    ) external onlyAuthorizedLab {
        require(bytes(reportHash).length > 0, "Invalid report hash");
        require(!reports[reportHash].exists, "Report already exists");

        reports[reportHash] = Report({
            reportHash: reportHash,
            patientId: patientId,
            labId: labId,
            timestamp: block.timestamp,
            exists: true
        });

        emit ReportAdded(reportHash, patientId, labId, block.timestamp, msg.sender);
    }

    function verifyReport(string memory reportHash) external view returns (bool) {
        return reports[reportHash].exists;
    }

    function getReport(string memory reportHash) external view returns (Report memory) {
        return reports[reportHash];
    }
}
