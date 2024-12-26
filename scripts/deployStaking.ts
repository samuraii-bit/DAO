import { writeFileSync } from 'fs';
import { ethers } from "hardhat";
import { join } from 'path';
import {name, rewardRate, stakeLockTime, unstakeLockTime, rewardTokenAddress, lpTokenAddress} from "./config/Staking.config";

const contractsInfoPath = "./scripts/contractsAddresses/"

async function main() {
    const stakingContractFactory = await ethers.getContractFactory(name);
    const StakingContract = await stakingContractFactory.deploy(rewardRate, stakeLockTime, unstakeLockTime, rewardTokenAddress, lpTokenAddress);

    await StakingContract.waitForDeployment();

    console.log(`Contract deployed to: ${StakingContract.target}`);
    const addresses = {stakingContractAddress: StakingContract.target, ownerAddress: StakingContract.deploymentTransaction()?.from};
    writeFileSync(join(contractsInfoPath, "stakingContract.json"), JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});