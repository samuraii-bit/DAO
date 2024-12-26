// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../../interfaces/IMyFirstToken.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract LPToken is IMyFirstToken, AccessControl {
    bytes32 public constant STAKING_CONTRACT_ROLE = keccak256("STAKING_CONTRACT_ROLE");

    address public owner;
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public initialSupply;
    uint256 public totalSupply;
    address public stakingContract;

    event SetStakingContract(address _stakingContract);

    mapping (address => uint256) public balanceOf;
    mapping (address => mapping (address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _initialSupply) {
        owner = msg.sender;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        initialSupply = _initialSupply;
        
        mint(owner, initialSupply);
    }

    function setStakingContract(address _stakingContract) external {
        require(msg.sender == owner, "Only owner can set stakingContract");

        stakingContract = _stakingContract;
        _grantRole(STAKING_CONTRACT_ROLE, stakingContract);
        
        emit SetStakingContract(stakingContract);
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
        require(allowance[_from][_to] >= _value ||
                hasRole(STAKING_CONTRACT_ROLE, msg.sender), 
                "At first u have to get a permission for the transfer");
        require(balanceOf[_from] >= _value, "There are not enough funds on the balance sheet");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        if (!hasRole(STAKING_CONTRACT_ROLE, msg.sender)){
            allowance[_from][_to] -= _value;
        }

        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success){        
        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);
        return true;
    }
}