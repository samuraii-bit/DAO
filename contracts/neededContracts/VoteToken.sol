// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import "../interfaces/IVoteToken.sol";

contract VoteToken is IVoteToken {
    address public owner;
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping (address => uint256) public balanceOf;
    mapping (address => mapping (address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _initialSupply) {
        owner = msg.sender;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;

        mint(owner, _initialSupply);
    }

    function mint(address _to, uint256 _value) public {
        require(msg.sender == owner, "Only owner can mint tokens");
        balanceOf[_to] += _value;
        totalSupply += _value;

        emit Mint(address(0), _to, _value);
    }

    function burn(address _from, uint256 _value) public {
        require(msg.sender == owner, "Only owner can burn tokens");
        require(_value <= balanceOf[_from], "There are not enough tokens to burn them");
        balanceOf[_from] -= _value;
        totalSupply -= _value;

        emit Burn(_from, address(0), _value);
    }

    function transfer(address _to, uint256 _value) public returns (bool success){
        require(balanceOf[msg.sender] >= _value, "There are not enough funds on the balance sheet");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom (address _from, address _to, uint256 _value) public returns (bool success){
        require(allowance[_from][_to] >= _value, "At first u have to get a permission for the transfer");
        require(balanceOf[_from] >= _value, "There are no funds enough on the balance sheet");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][_to] -= _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success){        
        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);
        return true;
    }
}