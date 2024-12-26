import { ethers } from "hardhat";

export const name = "Staking";
export const rewardRate = 10;
export const stakeLockTime = 60 * 60 * 24;
export const unstakeLockTime = 60 * 60 * 24 * 2;
export const rewardTokenAddress = ethers.getAddress('0xb777D19b6f9bA97ad720909Ab3a2a5bCe4873e43');
export const lpTokenAddress = ethers.getAddress('0xb777D19b6f9bA97ad720909Ab3a2a5bCe4873e43');