// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error AirDrop__AlreadyClaimed();
error AirDrop__ClaimedFailed();
error AirDrop__AlreadyParticipated();
error AirDrop__ParticipationEnded();
error AirDrop__NotInitiated();
error AirDrop__AlreadyInitiated();
error AirDrop__IncorrectMerkleProof();

contract AirDrop is Ownable, ReentrancyGuard {
    IERC20 private s_token;
    bytes32 private s_root;
    uint256 private s_rewardAmount;
    bool private s_initiated;
    mapping(address => bool) s_claimed;
    mapping(address => bool) s_participated;

    event Participated(address);
    event Claimed(address);
    event AirDropInitiated(uint256);

    constructor() {}

    function initiateAirdrop(
        bytes32 _root,
        address _token,
        uint256 _rewardAmount
    ) external onlyOwner {
        if (s_initiated) {
            revert AirDrop__AlreadyInitiated();
        }
        s_token = IERC20(_token);
        s_root = _root;
        s_rewardAmount = _rewardAmount;
        s_initiated = true;
        emit AirDropInitiated(_rewardAmount);
    }

    function claim(bytes32[] calldata _proof) external nonReentrant {
        if (!s_initiated) {
            revert AirDrop__NotInitiated();
        }
        if (s_claimed[msg.sender]) {
            revert AirDrop__AlreadyClaimed();
        }
        bytes32 _leaf = keccak256(abi.encodePacked(msg.sender));

        if (!MerkleProof.verify(_proof, s_root, _leaf)) {
            revert AirDrop__IncorrectMerkleProof();
        }

        s_claimed[msg.sender] = true;

        if (!s_token.transfer(msg.sender, s_rewardAmount)) {
            revert AirDrop__ClaimedFailed();
        }

        emit Claimed(msg.sender);
    }

    function participate() external {
        if (s_initiated) {
            revert AirDrop__ParticipationEnded();
        }
        if (s_participated[msg.sender]) {
            revert AirDrop__AlreadyParticipated();
        }
        s_participated[msg.sender] = true;
        emit Participated(msg.sender);
    }

    function getRewardAmount() external view returns (uint256) {
        return s_rewardAmount;
    }

    function isInitiated() external view returns (bool) {
        return s_initiated;
    }
}
