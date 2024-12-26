// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "./interfaces/IDAO.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IStaking.sol";
import "./interfaces/IVoteToken.sol";

contract DAO is IDAO, AccessControl {
    bytes32 public constant CHAIRMAN_ROLE = keccak256("CHAIRMAN_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    uint8 public constant changeRewardRate = 1;
    uint8 public constant changeStakeLockTime = 2;
    uint8 public constant changeUnstakeLockTime = 3;

    uint256 public totalVotings;
    uint256 public finishLockTime;

    IVoteToken public voteToken;
    IStaking public staking;

    struct Proposal {
        uint8 proposalType;
        uint256 proposalNum;
    }
    
    struct Voting {
        bool finished;
        uint256 startTime;
        uint256 votesFor;
        uint256 votesAgainst;
        Proposal proposal;
        mapping (address => uint256) totalVotes;        
    }

    mapping (uint256 => Voting) public votings;
    mapping (address => uint256) public depositOf;
    mapping (address => uint256[]) private votingsOfVoter;

    constructor(uint256 _finishLockTime, address _voteTokenAddress, address _stakingContractAddress) {
        totalVotings = 0;
        finishLockTime = _finishLockTime;
        voteToken = IVoteToken(_voteTokenAddress);
        staking = IStaking(_stakingContractAddress);
        _grantRole(CHAIRMAN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function setChairman (address _to) external onlyRole(ADMIN_ROLE) {
        _grantRole(CHAIRMAN_ROLE, _to);
        emit SetChairman(msg.sender, _to);
    }
    
    function deposit(uint256 _amount) external {
        depositOf[msg.sender] += _amount;
        voteToken.transferFrom(msg.sender, address(this), _amount);
        
        emit Deposit(msg.sender, _amount);
    }

    function vote(uint256 _votingId, uint256 _amount, bool _vote) public {
        require(
                votings[_votingId].finished == false, 
                "Voting already finished"
                );
        require(
                _amount <= (depositOf[msg.sender] - votings[_votingId].totalVotes[msg.sender]), 
                "U dont have deposit enough"
                );

        if (_vote) {
            votings[_votingId].votesFor += _amount;
        }
        else {
            votings[_votingId].votesAgainst += _amount;
        }
        
        votingsOfVoter[msg.sender].push(_votingId);
        votings[_votingId].totalVotes[msg.sender] += _amount;

        emit Vote(msg.sender, _votingId, _vote, _amount);
    }

    function finish(uint256 _votingId) external {
        require(block.timestamp >= votings[_votingId].startTime + finishLockTime, "U have to wait");

        if (votings[_votingId].votesFor > votings[_votingId].votesAgainst){
            if (votings[_votingId].proposal.proposalType == changeRewardRate) { 
                staking.setNewRewardRate(votings[_votingId].proposal.proposalNum);
            }
            else if (votings[_votingId].proposal.proposalType == changeStakeLockTime) {
                staking.setNewStakeLockTime(votings[_votingId].proposal.proposalNum);
            } 
            else {
                staking.setNewUnstakeLockTime(votings[_votingId].proposal.proposalNum);
            }
        }

        votings[_votingId].finished = true;
        emit Finish(msg.sender, _votingId, votings[_votingId].proposal.proposalType, votings[_votingId].proposal.proposalNum);
    }

    function withdraw() external {
        require(depositOf[msg.sender] > 0, "Nothing to withdraw");

        uint256 length = votingsOfVoter[msg.sender].length;
        for (uint256 i = 0; i < length; i++){
            require(votings[votingsOfVoter[msg.sender][i]].finished, "Not all votings of this voter were finished");
        }

        votingsOfVoter[msg.sender] = new uint256[](0);
        voteToken.transfer(msg.sender, depositOf[msg.sender]);
        
        emit Withdraw(msg.sender, depositOf[msg.sender]);
        depositOf[msg.sender] = 0;
    }

    function addProposal(uint8 _proposalType, uint256 _proposalNum) onlyRole(CHAIRMAN_ROLE) external {
        if (_proposalType == changeRewardRate) { 
            require(_proposalNum <= 100, "Invalid rewardRate");
        }
        else if (_proposalType != changeStakeLockTime && _proposalType != changeUnstakeLockTime){
            revert("Unknown proposal");
        }
        totalVotings++;
        votings[totalVotings].finished = false;
        votings[totalVotings].startTime = block.timestamp;
        votings[totalVotings].votesFor = 0;
        votings[totalVotings].votesAgainst = 0;
        votings[totalVotings].proposal.proposalType = _proposalType;
        votings[totalVotings].proposal.proposalNum = _proposalNum;

        emit AddProposal(totalVotings, votings[totalVotings].proposal.proposalType, votings[totalVotings].proposal.proposalNum);
    }
}