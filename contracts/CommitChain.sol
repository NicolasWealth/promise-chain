// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PromiseChain Escrow
 * @notice On-chain ETH escrow system for commitments with verifiable evidence and an authorized resolver.
 */
contract CommitChain is Ownable, ReentrancyGuard {
    enum Status {
        Active,
        EvidenceSubmitted,
        Successful,
        Failed
    }

    struct Commitment {
        uint256 id;
        address creator;
        address payable beneficiary;
        uint256 amount;
        uint256 deadline;
        string description;
        string evidenceType;
        string evidenceReference;
        Status status;
    }

    uint256 public nextCommitmentId = 1;
    address public resolver;

    mapping(uint256 => Commitment) public commitments;

    // --- Custom Errors ---
    error ZeroAmount();
    error InvalidBeneficiary();
    error InvalidDeadline();
    error CommitmentNotFound();
    error CommitmentNotActive();
    error CommitmentAlreadyResolved();
    error DeadlineNotReached();
    error UnauthorizedResolver();
    error TransferFailed();
    error ZeroAddress();

    // --- Events ---
    event CommitmentCreated(
        uint256 indexed id,
        address indexed creator,
        address indexed beneficiary,
        uint256 amount,
        uint256 deadline,
        string description,
        string evidenceType,
        string evidenceReference
    );

    event EvidenceSubmitted(
        uint256 indexed id,
        string evidenceType,
        string evidenceReference
    );

    event CommitmentResolved(
        uint256 indexed id,
        Status status,
        address indexed recipient,
        uint256 amount
    );

    event ResolverUpdated(address indexed oldResolver, address indexed newResolver);

    modifier onlyResolver() {
        if (msg.sender != resolver) revert UnauthorizedResolver();
        _;
    }

    constructor(address _initialResolver) Ownable(msg.sender) {
        if (_initialResolver == address(0)) revert ZeroAddress();
        resolver = _initialResolver;
        emit ResolverUpdated(address(0), _initialResolver);
    }

    /**
     * @notice Create a new ETH commitment with locked funds.
     * @param _beneficiary Address that receives funds on successful resolution.
     * @param _deadline Unix timestamp after which commitment expires.
     * @param _description Description of the commitment.
     * @param _evidenceType Category of evidence (e.g. "github_pr").
     * @param _evidenceReference Reference link or ID (e.g. "project-alpha/app#142").
     */
    function createCommitment(
        address payable _beneficiary,
        uint256 _deadline,
        string calldata _description,
        string calldata _evidenceType,
        string calldata _evidenceReference
    ) external payable returns (uint256 commitmentId) {
        if (msg.value == 0) revert ZeroAmount();
        if (_beneficiary == address(0)) revert InvalidBeneficiary();
        if (_deadline <= block.timestamp) revert InvalidDeadline();

        commitmentId = nextCommitmentId++;

        commitments[commitmentId] = Commitment({
            id: commitmentId,
            creator: msg.sender,
            beneficiary: _beneficiary,
            amount: msg.value,
            deadline: _deadline,
            description: _description,
            evidenceType: _evidenceType,
            evidenceReference: _evidenceReference,
            status: Status.Active
        });

        emit CommitmentCreated(
            commitmentId,
            msg.sender,
            _beneficiary,
            msg.value,
            _deadline,
            _description,
            _evidenceType,
            _evidenceReference
        );
    }

    /**
     * @notice Submit or update evidence reference metadata for a commitment.
     */
    function submitEvidence(
        uint256 _id,
        string calldata _evidenceType,
        string calldata _evidenceReference
    ) external onlyResolver {
        Commitment storage commitment = commitments[_id];
        if (commitment.id == 0) revert CommitmentNotFound();
        if (commitment.status != Status.Active && commitment.status != Status.EvidenceSubmitted) {
            revert CommitmentAlreadyResolved();
        }

        commitment.evidenceType = _evidenceType;
        commitment.evidenceReference = _evidenceReference;
        commitment.status = Status.EvidenceSubmitted;

        emit EvidenceSubmitted(_id, _evidenceType, _evidenceReference);
    }

    /**
     * @notice Resolve a commitment. Only authorized resolver can call.
     * @param _id ID of the commitment.
     * @param _success True to send funds to beneficiary, false to refund creator.
     */
    function resolveCommitment(uint256 _id, bool _success) external onlyResolver nonReentrant {
        Commitment storage commitment = commitments[_id];
        if (commitment.id == 0) revert CommitmentNotFound();
        if (commitment.status == Status.Successful || commitment.status == Status.Failed) {
            revert CommitmentAlreadyResolved();
        }
        if (!_success && block.timestamp < commitment.deadline) {
            revert DeadlineNotReached();
        }

        uint256 payoutAmount = commitment.amount;
        address payable recipient;

        if (_success) {
            commitment.status = Status.Successful;
            recipient = commitment.beneficiary;
        } else {
            commitment.status = Status.Failed;
            recipient = payable(commitment.creator);
        }

        emit CommitmentResolved(_id, commitment.status, recipient, payoutAmount);

        (bool sent, ) = recipient.call{value: payoutAmount}("");
        if (!sent) revert TransferFailed();
    }

    /**
     * @notice Update the authorized resolver address.
     */
    function setResolver(address _newResolver) external onlyOwner {
        if (_newResolver == address(0)) revert ZeroAddress();
        address oldResolver = resolver;
        resolver = _newResolver;
        emit ResolverUpdated(oldResolver, _newResolver);
    }

    /**
     * @notice Fetch commitment details by ID.
     */
    function getCommitment(uint256 _id) external view returns (Commitment memory) {
        Commitment memory commitment = commitments[_id];
        if (commitment.id == 0) revert CommitmentNotFound();
        return commitment;
    }
}
