import { writeFileSync } from 'fs';
import { ethers } from "hardhat";
import { join } from 'path';
import {DAOname, finishLockTime} from "./config/DAO.config";
import {stakingContractAddress} from "./contractsAddresses/stakingContract.json";
import {voteTokenContractAddress} from "./contractsAddresses/voteToken.json";

const contractsInfoPath = "./scripts/contractsAddresses/"

async function main() {
    const DAOFactory = await ethers.getContractFactory(DAOname);
    const DAO = await DAOFactory.deploy(finishLockTime, voteTokenContractAddress, stakingContractAddress);

    await DAO.waitForDeployment();

    console.log(`Contract deployed to: ${DAO.target}`);
    const addresses = {DAOContractAddress: DAO.target, ownerAddress: DAO.deploymentTransaction()?.from};
    writeFileSync(join(contractsInfoPath, "DAO.json"), JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});