// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EverGuardCapsules
 * @dev Smart contract for EverGuard - Secure encrypted capsule storage with BurstKey access control
 * Built for BlockDAG Network
 */
contract EverGuardCapsules {
    
    // ============ Structs ============
    
    struct Capsule {
        uint256 id;
        string capsuleHash;      // SHA-256 of encrypted content
        uint256 timestamp;
        string capsuleType;      // "medical", "legal", "financial"
        address owner;
        CapsuleStatus status;
    }
    
    struct BurstKeyAccess {
        uint256 burstId;
        uint256 capsuleId;
        address accessor;
        uint256 issuedAt;
        uint256 expiresAt;
        bool consumed;
        string contextHash;      // Hash of geolocation + device info
    }
    
    enum CapsuleStatus { Active, Revoked }
    
    // ============ State Variables ============
    
    Capsule[] public capsules;
    BurstKeyAccess[] public burstKeys;
    
    mapping(address => uint256[]) public userCapsules;
    mapping(uint256 => uint256[]) public capsuleAccessLog;
    
    address public owner;
    uint256 public totalCapsules;
    uint256 public totalBurstKeys;
    
    // ============ Events ============
    
    event CapsuleCreated(
        uint256 indexed id,
        string capsuleHash,
        string capsuleType,
        address indexed owner,
        uint256 timestamp
    );
    
    event BurstKeyIssued(
        uint256 indexed burstId,
        uint256 indexed capsuleId,
        address indexed accessor,
        uint256 expiresAt,
        string contextHash
    );
    
    event BurstKeyConsumed(
        uint256 indexed burstId,
        uint256 indexed capsuleId,
        address indexed accessor,
        uint256 consumedAt
    );
    
    event CapsuleRevoked(
        uint256 indexed capsuleId,
        address indexed owner
    );
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this");
        _;
    }
    
    modifier capsuleExists(uint256 _capsuleId) {
        require(_capsuleId < capsules.length, "Capsule does not exist");
        _;
    }
    
    modifier onlyCapsuleOwner(uint256 _capsuleId) {
        require(_capsuleId < capsules.length, "Capsule does not exist");
        require(capsules[_capsuleId].owner == msg.sender, "Not capsule owner");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
        totalCapsules = 0;
        totalBurstKeys = 0;
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Create a new encrypted capsule
     * @param _capsuleHash SHA-256 hash of encrypted content
     * @param _capsuleType Type of capsule (medical, legal, financial)
     * @return uint256 ID of created capsule
     */
    function createCapsule(
        string memory _capsuleHash,
        string memory _capsuleType
    ) public returns (uint256) {
        uint256 newId = capsules.length;
        
        Capsule memory newCapsule = Capsule({
            id: newId,
            capsuleHash: _capsuleHash,
            timestamp: block.timestamp,
            capsuleType: _capsuleType,
            owner: msg.sender,
            status: CapsuleStatus.Active
        });
        
        capsules.push(newCapsule);
        userCapsules[msg.sender].push(newId);
        totalCapsules++;
        
        emit CapsuleCreated(newId, _capsuleHash, _capsuleType, msg.sender, block.timestamp);
        
        return newId;
    }
    
    /**
     * @dev Issue a BurstKey for temporary emergency access
     * @param _capsuleId ID of capsule to access
     * @param _accessor Address of person requesting access (e.g., medic)
     * @param _expiresAt Unix timestamp when key expires
     * @param _contextHash Hash of access context (location, device, etc.)
     * @return uint256 ID of issued BurstKey
     */
    function issueBurstKey(
        uint256 _capsuleId,
        address _accessor,
        uint256 _expiresAt,
        string memory _contextHash
    ) public capsuleExists(_capsuleId) returns (uint256) {
        require(capsules[_capsuleId].status == CapsuleStatus.Active, "Capsule not active");
        require(_expiresAt > block.timestamp, "Expiry must be in future");
        require(_accessor != address(0), "Invalid accessor address");
        
        uint256 burstId = burstKeys.length;
        
        BurstKeyAccess memory newBurstKey = BurstKeyAccess({
            burstId: burstId,
            capsuleId: _capsuleId,
            accessor: _accessor,
            issuedAt: block.timestamp,
            expiresAt: _expiresAt,
            consumed: false,
            contextHash: _contextHash
        });
        
        burstKeys.push(newBurstKey);
        capsuleAccessLog[_capsuleId].push(burstId);
        totalBurstKeys++;
        
        emit BurstKeyIssued(burstId, _capsuleId, _accessor, _expiresAt, _contextHash);
        
        return burstId;
    }
    
    /**
     * @dev Mark a BurstKey as consumed (single-use)
     * @param _burstId ID of BurstKey to consume
     */
    function consumeBurstKey(uint256 _burstId) public {
        require(_burstId < burstKeys.length, "BurstKey does not exist");
        require(!burstKeys[_burstId].consumed, "BurstKey already consumed");
        require(block.timestamp <= burstKeys[_burstId].expiresAt, "BurstKey expired");
        require(msg.sender == burstKeys[_burstId].accessor, "Not authorized accessor");
        
        burstKeys[_burstId].consumed = true;
        
        emit BurstKeyConsumed(
            _burstId,
            burstKeys[_burstId].capsuleId,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Revoke a capsule (emergency shutdown)
     * @param _capsuleId ID of capsule to revoke
     */
    function revokeCapsule(uint256 _capsuleId) public onlyCapsuleOwner(_capsuleId) {
        require(capsules[_capsuleId].status == CapsuleStatus.Active, "Already revoked");
        
        capsules[_capsuleId].status = CapsuleStatus.Revoked;
        
        emit CapsuleRevoked(_capsuleId, msg.sender);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get capsule details
     * @param _id Capsule ID
     * @return Capsule struct
     */
    function getCapsule(uint256 _id) public view capsuleExists(_id) returns (Capsule memory) {
        return capsules[_id];
    }
    
    /**
     * @dev Get BurstKey details
     * @param _burstId BurstKey ID
     * @return BurstKeyAccess struct
     */
    function getBurstKey(uint256 _burstId) public view returns (BurstKeyAccess memory) {
        require(_burstId < burstKeys.length, "BurstKey does not exist");
        return burstKeys[_burstId];
    }
    
    /**
     * @dev Get all capsule IDs owned by an address
     * @param _user User address
     * @return Array of capsule IDs
     */
    function getUserCapsules(address _user) public view returns (uint256[] memory) {
        return userCapsules[_user];
    }
    
    /**
     * @dev Get access log for a capsule (all BurstKey IDs)
     * @param _capsuleId Capsule ID
     * @return Array of BurstKey IDs
     */
    function getCapsuleAccessLog(uint256 _capsuleId) public view capsuleExists(_capsuleId) returns (uint256[] memory) {
        return capsuleAccessLog[_capsuleId];
    }
    
    /**
     * @dev Get total number of capsules
     * @return Total capsule count
     */
    function getCapsuleCount() public view returns (uint256) {
        return capsules.length;
    }
    
    /**
     * @dev Get total number of BurstKeys issued
     * @return Total BurstKey count
     */
    function getBurstKeyCount() public view returns (uint256) {
        return burstKeys.length;
    }
    
    /**
     * @dev Check if a BurstKey is valid (not consumed and not expired)
     * @param _burstId BurstKey ID
     * @return bool validity status
     */
    function isBurstKeyValid(uint256 _burstId) public view returns (bool) {
        if (_burstId >= burstKeys.length) return false;
        
        BurstKeyAccess memory burst = burstKeys[_burstId];
        return !burst.consumed && block.timestamp <= burst.expiresAt;
    }
    
    /**
     * @dev Get contract statistics
     * @return totalCaps Total capsules
     * @return totalBursts Total BurstKeys
     * @return activeCaps Active capsules count
     */
    function getStats() public view returns (
        uint256 totalCaps,
        uint256 totalBursts,
        uint256 activeCaps
    ) {
        uint256 active = 0;
        for (uint256 i = 0; i < capsules.length; i++) {
            if (capsules[i].status == CapsuleStatus.Active) {
                active++;
            }
        }
        
        return (totalCapsules, totalBurstKeys, active);
    }
}

