// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVoteToken {
    function owner() external view returns (address);
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);

    function balanceOf(address _owner) external view returns (uint256);
    function allowance(address _owner, address _spender) external view returns (uint256 remaining);
    
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event Mint(address _from, address indexed _to, uint256 _value);
    event Burn(address indexed _from, address _to, uint256 _value);

    function mint(address _to, uint256 _value) external;
    function burn(address _from, uint256 _value) external;
    function transfer(address _to, uint256 _value) external returns (bool success);
    function transferFrom (address _from, address _to, uint256 _value) external returns (bool success);
    function approve(address _spender, uint256 _value) external returns (bool success);
}
