// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "../interfaces/IVoteToken.sol";
import "../interfaces/IStaking.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract Staking is IStaking, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    IVoteToken public rewardToken;
    IERC20 public lpToken;

    struct stakesInfo {
        uint256 balance;
        uint256 lastStakeTimeStamp;
        uint256 reward;
        uint256 unstakeAvailable;
    }

    mapping (address => stakesInfo) public stakes;

    uint256 public rewardRate;
    uint256 public stakeLockTime;
    uint256 public unstakeLockTime;

    constructor(uint256 _rewardRate, uint256 _stakeLockTime, uint256 _unstakeLockTime, address _rewardToken, address _lpToken) {
        rewardRate = _rewardRate;
        stakeLockTime = _stakeLockTime;
        unstakeLockTime = _unstakeLockTime;

        _grantRole(ADMIN_ROLE, msg.sender);

        rewardToken = IVoteToken(_rewardToken);
        lpToken = IERC20(_lpToken);
    }

    function setAdmin(address _to) external onlyRole(ADMIN_ROLE) {
        _grantRole(ADMIN_ROLE, _to);
        emit SetAdmin(msg.sender, _to);
    }
    
    function stake(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(block.timestamp >= stakes[msg.sender].lastStakeTimeStamp + stakeLockTime, "U have to wait");

        if (stakes[msg.sender].balance > 0) {
            if (block.timestamp >= stakes[msg.sender].lastStakeTimeStamp + unstakeLockTime)
            {
                stakes[msg.sender].unstakeAvailable += (stakes[msg.sender].balance - stakes[msg.sender].unstakeAvailable);
            }
        }
        
        calculateCurrentReward(msg.sender);

        lpToken.transferFrom(msg.sender, address(this), _amount);
        stakes[msg.sender].balance += _amount;
        stakes[msg.sender].lastStakeTimeStamp = block.timestamp;

        emit Stake(msg.sender, _amount);
    }    

    function claim() external {
        calculateCurrentReward(msg.sender);
        require(stakes[msg.sender].reward > 0, "There are no available rewards");

        rewardToken.mint(address(this), stakes[msg.sender].reward);
        rewardToken.transferFrom(address(this), msg.sender, stakes[msg.sender].reward);
        stakes[msg.sender].reward = 0;
        
        emit Claim(msg.sender);
    }

    function unstake() public {
        if (stakes[msg.sender].balance > 0) {
            if (block.timestamp >= stakes[msg.sender].lastStakeTimeStamp + unstakeLockTime)
            {
                stakes[msg.sender].unstakeAvailable += (stakes[msg.sender].balance - stakes[msg.sender].unstakeAvailable);
            }
        }
        require(stakes[msg.sender].unstakeAvailable > 0, "There are no tokens to unstake");     

        calculateCurrentReward(msg.sender);

        lpToken.transferFrom(address(this), msg.sender, stakes[msg.sender].unstakeAvailable);
        stakes[msg.sender].balance -= stakes[msg.sender].unstakeAvailable;
        stakes[msg.sender].unstakeAvailable = 0;
        
        emit Unstake(msg.sender);
    }

    function setNewRewardRate(uint256 _rewardRate) external onlyRole(ADMIN_ROLE) {
        rewardRate = _rewardRate;
        
        emit SetNewRewardRate(_rewardRate);
    }
    
    function setNewStakeLockTime(uint256 _stakeLockTime) external onlyRole(ADMIN_ROLE) {
        stakeLockTime = _stakeLockTime;

        emit SetNewStakeLockTime(_stakeLockTime);
    }

    function setNewUnstakeLockTime(uint256 _unstakeLockTime) external onlyRole(ADMIN_ROLE) {
        unstakeLockTime = _unstakeLockTime;

        emit SetNewUnstakeLockTime(_unstakeLockTime);
    }

    function calculateCurrentReward(address _staker) public returns (uint256) {
        stakes[_staker].reward += 
            (stakes[_staker].balance * rewardRate * (block.timestamp - stakes[_staker].lastStakeTimeStamp))
            /
            (100 * (365 days));
        return stakes[_staker].reward;
    }
}