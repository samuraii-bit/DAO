import { ethers } from "hardhat";

export const name = "VoteToken";
export const symbol = "VT";
export const decimals = 18;
export const initialSupply = ethers.parseUnits("1000000", decimals);