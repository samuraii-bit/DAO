import { ethers } from "hardhat";

export const name = "LPToken";
export const symbol = "LPT";
export const decimals = 18;
export const initialSupply = ethers.parseUnits("10000000000", decimals);