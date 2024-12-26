import { writeFileSync } from 'fs';
import { ethers } from "hardhat";
import { join } from 'path';
import {name as vtName, symbol, decimals, initialSupply} from "./config/VoteToken.config";

const contractsInfoPath = "./scripts/contractsAddresses/"

async function main() {
    const voteTokenFactory = await ethers.getContractFactory(vtName);
    const voteToken = await voteTokenFactory.deploy(vtName, symbol, decimals, initialSupply); 

    await voteToken.waitForDeployment();

    console.log(`Contract deployed to: ${voteToken.target}`);
    const addresses = {voteTokenContractAddress: voteToken.target, ownerAddress: voteToken.deploymentTransaction()?.from};
    writeFileSync(join(contractsInfoPath, "voteToken.json"), JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});