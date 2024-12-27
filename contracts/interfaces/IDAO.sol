// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IDAO {
    function vote(uint256 _votingId, uint256 _amount, bool _vote) external; // _vote = 1 - голос "За", _vote = 0 - голос "Против"
    function setChairman (address _to) external;
    function deposit(uint256 _amount) external;
    function finish(uint256 _votingId) external;
    function withdraw() external;
    function addProposal(bytes memory _callData) external;

}