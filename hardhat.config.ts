import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { DAOContractAddress } from "./scripts/contractsAddresses/DAO.json";
import { voteTokenContractAddress } from "./scripts/contractsAddresses/voteToken.json";
require("dotenv").config();

const DAOname = "DAO";
const changeRewardRate = 1;
const changeStakeLockTime = 2;
const changeUnstakeLockTime = 3;

const vtName = "VoteToken";

task("vote", "Vote for proposal")
  .addParam("account", "Your address")
  .addParam("id", "The id of voting")
  .addParam("amount", "The amount of votes")
  .addParam("vote", "true - for, \n false - against")
    .setAction(async (taskArgs, hre) => {
      const account = taskArgs.account;
      const id = taskArgs.id;
      const amount = taskArgs.amount;
      const vote = taskArgs.vote;
      const signer = await hre.ethers.getSigner(account);
      const DAO = await hre.ethers.getContractAt(DAOname, DAOContractAddress);
      const tx = await DAO.connect(signer).vote(id, amount, vote);
      const receipt = await tx.wait();

      if (receipt?.status === 1) {
        switch(vote){
        case true:
          console.log(`${amount} votes were successfully added for proposal ${id}`);
        case false:
          console.log(`${amount} votes were successfully added against proposal ${id}`);
        }
      } else {
          console.error("Transaction failed");
      };
    });

task("addProposal", "Add a proposal")
  .addParam("account", "Your address")
  .addParam("proposal", "The proposal: \n 1 - change rewardRate \n 2 - change stakeLockTime \n 3 - change unstakeLockTime")
  .addParam("num", "The proposal num (in seconds for time, in range(0,100) for change rate)")
    .setAction(async (taskArgs, hre) => {
      const account = taskArgs.account;
      const proposal = taskArgs.proposal;
      const num = taskArgs.num;
      const vote = taskArgs.vote;
      const signer = await hre.ethers.getSigner(account);
      const DAO = await hre.ethers.getContractAt(DAOname, DAOContractAddress);
      const tx = await DAO.connect(signer).addProposal(proposal, num);
      const receipt = await tx.wait();

      if (receipt?.status === 1) {
        switch(proposal) {
          case changeRewardRate:
            console.log(`Proposal to set rewardRate to ${num} percent(s) were successfully added`);   
          case changeStakeLockTime:
            console.log(`Proposal to set stakeLockTime to ${num} second(s) were successfully added`);
          case changeUnstakeLockTime:
            console.log(`Proposal to set unstakeLockTime to ${num} second(s) were successfully added`);
        }
      } else {
        console.error("Transaction failed");
      };
    });

task("finish", "Finish voting")
  .addParam("account", "Your address")
  .addParam("id", "The id of voting you want finish")
    .setAction(async (taskArgs, hre) => {
      const account = taskArgs.account;
      const id = taskArgs.id;
      const signer = await hre.ethers.getSigner(account);
      const DAO = await hre.ethers.getContractAt(DAOname, DAOContractAddress);
      const tx = await DAO.connect(signer).finish(id);
      const receipt = await tx.wait();

      if (receipt?.status === 1) {
          console.log(`The voting with id ${id} were successfully finished`);
      } else {
          console.error("Transaction failed");
      };
    });

task("deposit", "Vote for proposal")
  .addParam("account", "Your address")
  .addParam("amount", "The amount of votes u want to deposit")
    .setAction(async (taskArgs, hre) => {
      const account = taskArgs.account;
      const amount = taskArgs.amount;
      const signer = await hre.ethers.getSigner(account);
      const DAO = await hre.ethers.getContractAt(DAOname, DAOContractAddress);
      const tx = await DAO.connect(signer).deposit(amount);
      const receipt = await tx.wait();

      if (receipt?.status === 1) {
          console.log(`${amount} voteTokens were successfully deposited `);
      } else {
          console.error("Transaction failed");
      };
    });

task("mintVoteTokens", "Mint vote tokens")
  .addParam("account", "Your address")
  .addParam("to", "Receiver address")
  .addParam("amount", "The amount of tokens")
    .setAction(async (taskArgs, hre) => {
      const account = taskArgs.account;
      const to = taskArgs.to;
      const amount = taskArgs.amount;
      const signer = await hre.ethers.getSigner(account);
      const voteToken = await hre.ethers.getContractAt(vtName, voteTokenContractAddress);
      const tx = await voteToken.connect(signer).mint(to, amount);
      const receipt = await tx.wait();

      if (receipt?.status === 1) {
        console.log(`${amount} voteTokens were successfully minted to ${to}`);
      } else {
          console.error("Transaction failed");
      };
    });

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: process.env.PRIVATE_KEYS ? process.env.PRIVATE_KEYS.split(",") : [],
    },
    holesky: {
      url: process.env.HOLESKY_URL,
      accounts: process.env.PRIVATE_KEYS ? process.env.PRIVATE_KEYS.split(",") : [],
    }
  },
  etherscan :{
    apiKey: process.env.ETHERSCAN_API,
  },
};

export default config;