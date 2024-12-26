import { ethers } from "hardhat";

export const name = "MyFirstToken";
export const symbol = "MFT";
export const decimals = 18;
export const initialSupply = ethers.parseUnits("10000000000", decimals);