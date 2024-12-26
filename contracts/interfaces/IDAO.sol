// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IDAO {
    event Deposit(address _to, uint256 _amount);
    event Vote(address _voter, uint256 _votingId, bool _vote, uint256 _amount);
    event Finish(address _from, uint256 _votingId, uint8 _proposalType, uint256 _proposalNum);
    event Withdraw(address _to, uint256 _amount);
    event AddProposal(uint256 _votingId, uint8 _proposalType, uint256 _proposalNum);
    event SetChairman(address _from, address _to);

    function vote(uint256 _votingId, uint256 _amount, bool _vote) external; // _vote = 1 - голос "За", _vote = 0 - голос "Против"
    
}