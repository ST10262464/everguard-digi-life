// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * EmpowerHub Smart Contract for BlockDAG
 * Enhanced with DAG-specific features and validation
 */
contract EmpowerHubRequests {
    struct Request {
        uint256 id;
        string requestHash;
        uint256 timestamp;
        string requestType; // "finance", "gbv", "sanitary"
        address requester;
        RequestStatus status;
        uint256 confirmationScore;
    }

    enum RequestStatus {
        Pending,
        Confirmed,
        Finalized
    }

    struct DAGBlock {
        bytes32 blockHash;
        bytes32[] parentHashes;
        uint256 timestamp;
        uint256 cumulativeWeight;
        bool confirmed;
    }

    // State variables
    Request[] public requests;
    mapping(address => uint256[]) public userRequests;
    mapping(bytes32 => bool) public processedHashes;
    
    uint256 public totalRequests;
    uint256 public confirmedRequests;
    address public owner;
    uint256 public constant CONFIRMATION_THRESHOLD = 60; // 60% threshold

    // Events
    event RequestStored(
        uint256 id, 
        string requestHash, 
        uint256 timestamp, 
        string requestType, 
        address requester
    );
    event RequestConfirmed(uint256 indexed id, uint256 confirmationScore);
    event RequestFinalized(uint256 indexed id);
    event HashProcessed(bytes32 indexed dataHash, uint256 indexed requestId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier validRequest(uint256 _id) {
        require(_id < requests.length, "Request does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function storeRequest(
        string memory requestHash, 
        string memory requestType
    ) public {
        uint256 newId = requests.length;
        uint256 timestamp = block.timestamp;
        
        Request memory newRequest = Request({
            id: newId,
            requestHash: requestHash,
            timestamp: timestamp,
            requestType: requestType,
            requester: msg.sender,
            status: RequestStatus.Pending,
            confirmationScore: 0
        });
        
        requests.push(newRequest);
        userRequests[msg.sender].push(newId);
        totalRequests++;
        
        emit RequestStored(newId, requestHash, timestamp, requestType, msg.sender);
    }

    constructor() {
        owner = msg.sender;
        totalRequests = 0;
        confirmedRequests = 0;
    }

    /**
     * Get all requests
     */
    function getRequests() public view returns (Request[] memory) {
        return requests;
    }

    /**
     * Get request count
     */
    function getRequestCount() public view returns (uint256) {
        return requests.length;
    }

    /**
     * Get requests by user
     */
    function getUserRequests(address _user) public view returns (uint256[] memory) {
        return userRequests[_user];
    }

    /**
     * Update request confirmation
     */
    function updateRequestConfirmation(
        uint256 _requestId,
        uint256 _confirmationScore
    ) public onlyOwner validRequest(_requestId) {
        Request storage request = requests[_requestId];
        
        request.confirmationScore = _confirmationScore;

        // Update status based on confirmation score
        if (_confirmationScore >= CONFIRMATION_THRESHOLD && request.status == RequestStatus.Pending) {
            request.status = RequestStatus.Confirmed;
            confirmedRequests++;
            emit RequestConfirmed(_requestId, _confirmationScore);
        } else if (_confirmationScore >= 90 && request.status == RequestStatus.Confirmed) {
            request.status = RequestStatus.Finalized;
            emit RequestFinalized(_requestId);
        }
    }

    /**
     * Batch update multiple requests (gas optimization)
     */
    function batchUpdateConfirmations(
        uint256[] memory _requestIds,
        uint256[] memory _confirmationScores
    ) public onlyOwner {
        require(_requestIds.length == _confirmationScores.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _requestIds.length; i++) {
            updateRequestConfirmation(_requestIds[i], _confirmationScores[i]);
        }
    }

    /**
     * Get all requests
     */
    function getRequests() public view returns (Request[] memory) {
        return requests;
    }

<<<<<<< HEAD
    function getUserRequests(address user) public view returns (uint256[] memory) {
        return userRequests[user];
    }

    function getRequestById(uint256 id) public view returns (Request memory) {
        require(id < requests.length, "Request does not exist");
        return requests[id];
    }

    function getRequestCount() public view returns (uint256) {
        return requests.length;
=======
    /**
     * Get requests by user
     */
    function getUserRequests(address _user) public view returns (uint256[] memory) {
        return userRequests[_user];
    }

    /**
     * Get request details by ID
     */
    function getRequest(uint256 _id) public view validRequest(_id) returns (
        uint256 id,
        string memory description,
        address requester,
        uint256 timestamp,
        bytes32 dataHash,
        RequestStatus status,
        uint256 confirmationScore,
        bytes32[] memory parentBlocks
    ) {
        Request storage request = requests[_id];
        return (
            request.id,
            request.description,
            request.requester,
            request.timestamp,
            request.dataHash,
            request.status,
            request.confirmationScore,
            request.parentBlocks
        );
    }

    /**
     * Get confirmed requests only
     */
    function getConfirmedRequests() public view returns (Request[] memory) {
        Request[] memory confirmedRequestsArray = new Request[](confirmedRequests);
        uint256 confirmedIndex = 0;
        
        for (uint256 i = 0; i < requests.length; i++) {
            if (requests[i].status != RequestStatus.Pending) {
                confirmedRequestsArray[confirmedIndex] = requests[i];
                confirmedIndex++;
            }
        }
        
        return confirmedRequestsArray;
    }

    /**
     * Verify if a hash has been processed
     */
    function isHashProcessed(bytes32 _dataHash) public view returns (bool) {
        return processedHashes[_dataHash];
    }

    /**
     * Get DAG block information
     */
    function getDAGBlock(bytes32 _blockHash) public view returns (
        bytes32 blockHash,
        bytes32[] memory parentHashes,
        uint256 timestamp,
        uint256 cumulativeWeight,
        bool confirmed
    ) {
        DAGBlock storage dagBlock = dagBlocks[_blockHash];
        return (
            dagBlock.blockHash,
            dagBlock.parentHashes,
            dagBlock.timestamp,
            dagBlock.cumulativeWeight,
            dagBlock.confirmed
        );
    }

    /**
     * Get contract statistics
     */
    function getStats() public view returns (
        uint256 total,
        uint256 confirmed,
        uint256 pending,
        uint256 finalized
    ) {
        uint256 pendingCount = 0;
        uint256 finalizedCount = 0;
        
        for (uint256 i = 0; i < requests.length; i++) {
            if (requests[i].status == RequestStatus.Pending) {
                pendingCount++;
            } else if (requests[i].status == RequestStatus.Finalized) {
                finalizedCount++;
            }
        }
        
        return (totalRequests, confirmedRequests, pendingCount, finalizedCount);
    }

    /**
     * Emergency functions
     */
    function pause() public onlyOwner {
        // Implementation for pausing contract if needed
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
>>>>>>> origin/Broghan
    }
}
