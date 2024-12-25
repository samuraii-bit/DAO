import {loadFixture, ethers, expect, time} from "./setup";
import { DAOname, finishLockTime } from "./inits/DAO.init";
import {name as vtName, symbol, decimals, initialSupply } from "./inits/voteToken.init"

const changeRewardRate = 1;
const changeStakeLockTime = 2;
const changeUnstakeLockTime = 3;

describe("Testing Staking", function() {

    async function deploy() {
        const users = await ethers.getSigners();

        const voteTokenFactory = await ethers.getContractFactory(vtName);
        const voteToken = await voteTokenFactory.deploy(vtName, symbol, decimals, initialSupply); 

        const DAOFactory = await ethers.getContractFactory(DAOname);
        const DAO = await DAOFactory.deploy(finishLockTime, voteToken.target);

        const bigNum = 100000000;
        for (let i = 0; i < 5; i++){
            await voteToken.connect(users[0]).mint(users[i].address, bigNum);
            await voteToken.connect(users[i]).approve(DAO.target, bigNum);
        }

        return {users, DAO, voteToken};
    }

    it("Deployment test", async function(){
        const {DAO} = await loadFixture(deploy);
        expect(DAO.target).to.be.properAddress;
    });

    it("deposit test: just deposit 100 tokens", async function(){
        const {DAO, users, voteToken} = await loadFixture(deploy);
        const sum = 100;
        const tx = await DAO.connect(users[0]).deposit(sum);
        
        await expect(tx).to.emit(DAO, "Deposit").withArgs(users[0].address, sum);
        await expect(tx).to.changeTokenBalances(voteToken, [users[0].address, DAO.target] ,[-sum, sum]);
        await expect(await DAO.depositOf(users[0].address)).to.be.equal(sum);
    });

    it("addProposal test: adding proposal to set rateReward to 5 percents", async function(){
        const {DAO, users} = await loadFixture(deploy);
        const tx = await DAO.connect(users[0]).addProposal(changeRewardRate, 5);
        
        await expect(tx).to.emit(DAO, "AddProposal").withArgs(1, changeRewardRate, 5);
        await expect((await DAO.votings(1)).finished).to.be.false;
        await expect((await DAO.votings(1)).proposal.proposalType).to.be.equal(changeRewardRate);
        await expect((await DAO.votings(1)).proposal.proposalNum).to.be.equal(5);
    });

    it("addProposal test: adding proposal to set stakeLockTime to one week", async function(){
        const {DAO, users} = await loadFixture(deploy);
        const oneWeek = 60 * 60 * 24 * 7;
        const tx = await DAO.connect(users[0]).addProposal(changeStakeLockTime, oneWeek);
        
        await expect(tx).to.emit(DAO, "AddProposal").withArgs(1, changeStakeLockTime, oneWeek);
        await expect((await DAO.votings(1)).finished).to.be.false;
        await expect((await DAO.votings(1)).proposal.proposalType).to.be.equal(changeStakeLockTime);
        await expect((await DAO.votings(1)).proposal.proposalNum).to.be.equal(oneWeek);
    });

    it("addProposal test: adding proposal to set unStakeLockTime to one week", async function(){
        const {DAO, users} = await loadFixture(deploy);
        const oneWeek = 60 * 60 * 24 * 7;
        const tx = await DAO.connect(users[0]).addProposal(changeUnstakeLockTime, oneWeek);
        
        await expect(tx).to.emit(DAO, "AddProposal").withArgs(1, changeUnstakeLockTime, oneWeek);
        await expect((await DAO.votings(1)).finished).to.be.false;
        await expect((await DAO.votings(1)).proposal.proposalType).to.be.equal(changeUnstakeLockTime);
        await expect((await DAO.votings(1)).proposal.proposalNum).to.be.equal(oneWeek);
    });

    it("addProposal test: trying to add proposal to set rateReward to 101 percents", async function(){
        const {DAO, users} = await loadFixture(deploy);
        const tx = await DAO.connect(users[0]);
        
        await expect(tx.addProposal(changeRewardRate, 101)).to.be.revertedWith("Invalid rewardRate");
    });

    it("addProposal test: trying to add unknown proposal", async function(){
        const {DAO, users} = await loadFixture(deploy);
        const tx = await DAO.connect(users[0]);
        
        await expect(tx.addProposal(4, 99)).to.be.revertedWith("Unknown proposal");
    });

    it("addProposal test: trying to add unknown proposal ", async function(){
        const {DAO, users} = await loadFixture(deploy);
        const tx = await DAO.connect(users[1]);
        
        await expect(tx.addProposal(0, 99)).to.be.reverted;
    });

    it("vote test: vote 100 tokens for change rewardRate to 5 percents", async function(){
        const {DAO, users} = await loadFixture(deploy);
        await DAO.connect(users[0]).addProposal(changeRewardRate, 5);
        await DAO.connect(users[1]).deposit(100);

        const tx = await DAO.connect(users[1]).vote(1, 100, true);
        await expect(tx).to.emit(DAO, "Vote").withArgs(users[1].address, 1, true, 100);
        await expect((await DAO.votings(1)).votesFor).to.be.equal(100);
    });

    it("vote test: vote 100 tokens against change rewardRate to 5 percents", async function(){
        const {DAO, users} = await loadFixture(deploy);
        await DAO.connect(users[0]).addProposal(changeRewardRate, 5);
        await DAO.connect(users[1]).deposit(100);

        const tx = await DAO.connect(users[1]).vote(1, 100, false);
        await expect(tx).to.emit(DAO, "Vote").withArgs(users[1].address, 1, false, 100);
        await expect((await DAO.votings(1)).votesAgainst).to.be.equal(100);
    });
    
    it("vote test: trying to vote without enough deposit", async function(){
        const {DAO, users} = await loadFixture(deploy);
        await DAO.connect(users[0]).addProposal(changeRewardRate, 5);
        await DAO.connect(users[1]).deposit(10);

        const tx = await DAO.connect(users[1]);
        await expect(tx.vote(1, 11, false)).to.be.revertedWith("U dont have deposit enough");
    });
});