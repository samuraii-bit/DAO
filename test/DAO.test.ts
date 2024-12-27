import {loadFixture, ethers, expect, time} from "./setup";
import { DAOname, finishLockTime } from "./init/DAO.init";
import {vtName, symbol, decimals, initialSupply } from "./init/voteToken.init"
import {name as stakingName, rewardRate, stakeLockTime, unstakeLockTime} from "./init/stakingContracti.init";
import {name as lpTokenName} from "./init/lpToken.init"
import {name as MFTname, symbol as rewardTokenSymbol} from "./init/MFT.Init"
import { VoteToken__factory } from "../typechain-types";

describe("Testing Staking", function() {

    async function deploy() {
        const users = await ethers.getSigners();

        const voteTokenFactory = await ethers.getContractFactory(vtName);
        const voteToken = await voteTokenFactory.deploy(vtName, symbol, decimals, initialSupply); 

        const myFirstTokenFactory = await ethers.getContractFactory(MFTname);
        const rewardToken = await myFirstTokenFactory.deploy(MFTname, rewardTokenSymbol, decimals, initialSupply);

        const lpTokenFactory = await ethers.getContractFactory(lpTokenName);
        const lpToken = await lpTokenFactory.deploy(lpTokenName, symbol, decimals, initialSupply);
        
        const stakingFactory = await ethers.getContractFactory(stakingName);
        const Staking = await stakingFactory.deploy(rewardRate, stakeLockTime, unstakeLockTime, rewardToken.target, lpToken.target);

        const DAOFactory = await ethers.getContractFactory(DAOname);
        const DAO = await DAOFactory.deploy(finishLockTime, voteToken.target, Staking.target);

        await Staking.connect(users[0]).setAdmin(DAO.target);

        const bigNum = 100000000;
        for (let i = 0; i < 5; i++){
            await voteToken.connect(users[0]).mint(users[i].address, bigNum);
            await voteToken.connect(users[i]).approve(DAO.target, bigNum);
            await DAO.connect(users[0]).setChairman(users[i].address);
        }

        return {users, DAO, voteToken, Staking};
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
        const {DAO, users, Staking} = await loadFixture(deploy);
        const callData = Staking.interface.encodeFunctionData("setNewRewardRate", [5]);

        const tx = await DAO.connect(users[0]).addProposal(callData);
        
        await expect(tx).to.emit(DAO, "AddProposal").withArgs(1, callData);
        await expect((await DAO.votings(1)).finished).to.be.false;
        await expect((await DAO.votings(1)).callData).to.be.equal(callData);
    });

    it("addProposal test: adding proposal to set stakeLockTime to one week", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);
        const oneWeek = 60 * 60 * 24 * 7;
        const callData = Staking.interface.encodeFunctionData("setNewStakeLockTime", [oneWeek]);

        const tx = await DAO.connect(users[0]).addProposal(callData);
        
        await expect(tx).to.emit(DAO, "AddProposal").withArgs(1, callData);
        await expect((await DAO.votings(1)).finished).to.be.false;
        await expect((await DAO.votings(1)).callData).to.be.equal(callData);
    });

    it("addProposal test: adding proposal to set unStakeLockTime to one week", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);
        const oneWeek = 60 * 60 * 24 * 7;
        const callData = Staking.interface.encodeFunctionData("setNewUnstakeLockTime", [oneWeek]);
        
        const tx = await DAO.connect(users[0]).addProposal(callData);
        
        await expect(tx).to.emit(DAO, "AddProposal").withArgs(1, callData);
        await expect((await DAO.votings(1)).finished).to.be.false;
        await expect((await DAO.votings(1)).callData).to.be.equal(callData);
    });

    /*it("addProposal test: trying to add unknown proposal", async function(){
        const {DAO, users} = await loadFixture(deploy);
        const tx = await DAO.connect(users[0]);
        
        await expect(tx.addProposal(4, 99)).to.be.revertedWith("Unknown proposal");
    });

    it("addProposal test: trying to add unknown proposal ", async function(){
        const {DAO, users} = await loadFixture(deploy);
        const tx = await DAO.connect(users[1]);
        
        await expect(tx.addProposal(0, 99)).to.be.reverted;
    });*/

    it("addProposal test: trying to add proposal as non-chairman", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);
        const oneWeek = 60 * 60 * 24 * 7;
        const callData = Staking.interface.encodeFunctionData("setNewUnstakeLockTime", [oneWeek]);
        const tx = await DAO.connect(users[5]);
        
        await expect(tx.addProposal(callData)).to.be.revertedWithCustomError;
    });

    it("vote test: vote 100 tokens for change rewardRate to 5 percents", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);
        const callData = Staking.interface.encodeFunctionData("setNewRewardRate", [5]);        
        await DAO.connect(users[0]).addProposal(callData);
        await DAO.connect(users[1]).deposit(100);

        const tx = await DAO.connect(users[1]).vote(1, 100, true);
        await expect(tx).to.emit(DAO, "Vote").withArgs(users[1].address, 1, true, 100);
        await expect((await DAO.votings(1)).votesFor).to.be.equal(100);
    });

    it("vote test: vote 100 tokens against change rewardRate to 5 percents", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);
        const callData = Staking.interface.encodeFunctionData("setNewRewardRate", [5]);        
        await DAO.connect(users[0]).addProposal(callData);
        await DAO.connect(users[1]).deposit(100);

        const tx = await DAO.connect(users[1]).vote(1, 100, false);
        await expect(tx).to.emit(DAO, "Vote").withArgs(users[1].address, 1, false, 100);
        await expect((await DAO.votings(1)).votesAgainst).to.be.equal(100);
    });
    
    it("vote test: trying to vote without enough deposit", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);
        const callData = Staking.interface.encodeFunctionData("setNewRewardRate", [5]); 
        await DAO.connect(users[0]).addProposal(callData);
        await DAO.connect(users[1]).deposit(10);

        const tx = await DAO.connect(users[1]);
        await expect(tx.vote(1, 11, false)).to.be.revertedWith("U dont have deposit enough");
    });

    it("vote test: trying to vote without enough deposit", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);
        const callData = Staking.interface.encodeFunctionData("setNewRewardRate", [5]); 
        await DAO.connect(users[1]).deposit(10);

        const tx = await DAO.connect(users[1]);
        await expect(tx.vote(1, 11, false)).to.be.revertedWith("U dont have deposit enough");
    });

    it("vote test: trying to vote when voting already finished", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);
        const callData = Staking.interface.encodeFunctionData("setNewRewardRate", [5]); 
        await DAO.connect(users[1]).deposit(10);

        const oneDay = 60 * 60 * 24;
        await time.increase(oneDay);
        await DAO.connect(users[5]).finish(1);

        const tx = await DAO.connect(users[1]);
        await expect(tx.vote(1, 10, false)).to.be.revertedWith("Voting already finished");
    });

    it("finish test: just start and finish voting without votes", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);

        const oneDay = 60 * 60 * 24;
        await time.increase(oneDay);

        const tx = await DAO.connect(users[1]).finish(1);
        await expect(tx).to.emit(DAO, "Finish");
        await expect((await DAO.votings(1)).finished).to.be.equal(true);
    });

    it("finish test: start voting and finish when for votes more than against votes", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);
        const callData = Staking.interface.encodeFunctionData("setNewRewardRate", [15]);

        await DAO.connect(users[0]).addProposal(callData);
        await DAO.connect(users[1]).deposit(100);
        await DAO.connect(users[1]).vote(1, 100, true);

        const oneDay = 60 * 60 * 24;
        await time.increase(oneDay);

        const tx = await DAO.connect(users[1]).finish(1);
        await expect(tx).to.emit(DAO, "Finish").withArgs(users[1].address, 1, callData);
        await expect((await DAO.votings(1)).finished).to.be.equal(true);
        await expect(await Staking.rewardRate()).to.be.equal(15);
    });

    it("finish test: start voting to change rewardRate and finish when against votes more than for votes", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);
        const callData = Staking.interface.encodeFunctionData("setNewRewardRate", [15]);

        await DAO.connect(users[0]).addProposal(callData);
        await DAO.connect(users[1]).deposit(100);
        await DAO.connect(users[1]).vote(1, 100, false);

        const oneDay = 60 * 60 * 24;
        await time.increase(oneDay);

        const tx = await DAO.connect(users[1]).finish(1);
        await expect(tx).to.emit(DAO, "Finish").withArgs(users[1].address, 1, callData);
        await expect((await DAO.votings(1)).finished).to.be.equal(true);
        await expect(await Staking.rewardRate()).to.be.equal(10);
    });

    it("finish test: start voting to change stakeLockTime and finish when for votes more than against votes", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);
        
        const oneDay = 60 * 60 * 24;
        const oneWeek = oneDay * 7;
        const callData = Staking.interface.encodeFunctionData("setNewStakeLockTime", [oneWeek]); 

        await DAO.connect(users[0]).addProposal(callData);
        await DAO.connect(users[1]).deposit(100);
        await DAO.connect(users[1]).vote(1, 100, true);

        await time.increase(oneDay);

        const tx = await DAO.connect(users[1]).finish(1);
        await expect(tx).to.emit(DAO, "Finish").withArgs(users[1].address, 1, callData);
        await expect((await DAO.votings(1)).finished).to.be.equal(true);
        await expect(await Staking.stakeLockTime()).to.be.equal(oneWeek);
    });

    it("finish test: start voting to change unstakeLockTime and finish when for votes more than against votes", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);

        const oneDay = 60 * 60 * 24;
        const oneWeek = oneDay * 7;
        const callData = Staking.interface.encodeFunctionData("setNewUnstakeLockTime", [oneWeek]); 

        await DAO.connect(users[0]).addProposal(callData);
        await DAO.connect(users[1]).deposit(100);
        await DAO.connect(users[1]).vote(1, 100, true);

        await time.increase(oneDay);

        const tx = await DAO.connect(users[1]).finish(1);
        await expect(tx).to.emit(DAO, "Finish").withArgs(users[1].address, 1, callData);
        await expect((await DAO.votings(1)).finished).to.be.equal(true);
        await expect(await Staking.unstakeLockTime()).to.be.equal(oneWeek);
    });

    it("finish test: trying to finish voting before finishLockTime's up", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);

        const oneDay = 60 * 60 * 24;
        const oneWeek = oneDay * 7;
        const callData = Staking.interface.encodeFunctionData("setNewUnstakeLockTime", [oneWeek]); 
        
        await DAO.connect(users[0]).addProposal(callData);
        await DAO.connect(users[1]).deposit(100);
        await DAO.connect(users[1]).vote(1, 100, true);

        const tx = await DAO.connect(users[1]);
        await expect(tx.finish(1)).to.be.revertedWith("U have to wait");
    });

    it("withdraw test: just withdraw deposit", async function(){
        const {DAO, users, voteToken} = await loadFixture(deploy);
        await DAO.connect(users[2]).deposit(100);
        const tx = await DAO.connect(users[2]).withdraw();

        await expect(tx).to.emit(DAO, "Withdraw").withArgs(users[2].address, 100);
        await expect(tx).to.changeTokenBalances(voteToken, [users[2], DAO], [100, -100]);
        await expect(await DAO.depositOf(users[2].address)).to.be.equal(0);
    });

    it("withdraw test: trying to withdraw deposit when 0 on the balance", async function(){
        const {DAO, users, voteToken} = await loadFixture(deploy);
        const tx = await DAO.connect(users[2]);

        await expect(tx.withdraw()).to.be.revertedWith("Nothing to withdraw");
    });

    it("withdraw test: withdraw deposit when all votings finished", async function(){
        const {DAO, users, voteToken, Staking} = await loadFixture(deploy);

        const oneDay = 60 * 60 * 24;
        const fiveDays = oneDay * 5;
        const oneWeek = oneDay * 7;

        const stakeFiveDaysCallData = Staking.interface.encodeFunctionData("setNewUnstakeLockTime", [fiveDays]);
        const stakeOneWeekCallData = Staking.interface.encodeFunctionData("setNewUnstakeLockTime", [oneWeek]);
        const rewardRate13CallData = Staking.interface.encodeFunctionData("setNewRewardRate", [13]);
        const rewardRate20CallData = Staking.interface.encodeFunctionData("setNewRewardRate", [20]);

        await DAO.connect(users[0]).addProposal(rewardRate20CallData);
        await DAO.connect(users[1]).addProposal(rewardRate13CallData);
        await DAO.connect(users[2]).addProposal(stakeFiveDaysCallData);
        await DAO.connect(users[3]).addProposal(stakeOneWeekCallData);

        await DAO.connect(users[4]).deposit(100);
        await DAO.connect(users[4]).vote(1, 50, true);
        await DAO.connect(users[4]).vote(2, 25, false);
        await DAO.connect(users[4]).vote(3, 20, true);
        await DAO.connect(users[4]).vote(4, 5, false);

        await time.increase(oneDay);

        for (let i = 1; i < 5; i++){
            await DAO.connect(users[0]).finish(i);
        }

        const tx = DAO.connect(users[4]).withdraw();
        await expect(tx).to.emit(DAO, "Withdraw").withArgs(users[4].address, 100);
        await expect(tx).to.changeTokenBalances(voteToken, [users[4], DAO], [100, -100]);
        await expect(await DAO.depositOf(users[4].address)).to.be.equal(0);
    });

    it("withdraw test: trying to withdraw deposit when not all votings finished", async function(){
        const {DAO, users, Staking} = await loadFixture(deploy);

        const oneDay = 60 * 60 * 24;
        const fiveDays = oneDay * 5;
        const oneWeek = oneDay * 7;

        const stakeFiveDaysCallData = Staking.interface.encodeFunctionData("setNewUnstakeLockTime", [fiveDays]);
        const stakeOneWeekCallData = Staking.interface.encodeFunctionData("setNewUnstakeLockTime", [oneWeek]);
        const rewardRate13CallData = Staking.interface.encodeFunctionData("setNewRewardRate", [13]);
        const rewardRate20CallData = Staking.interface.encodeFunctionData("setNewRewardRate", [20]);

        await DAO.connect(users[0]).addProposal(rewardRate20CallData);
        await DAO.connect(users[1]).addProposal(rewardRate13CallData);
        await DAO.connect(users[2]).addProposal(stakeFiveDaysCallData);
        await DAO.connect(users[3]).addProposal(stakeOneWeekCallData);

        await DAO.connect(users[4]).deposit(100);
        await DAO.connect(users[4]).vote(1, 50, true);
        await DAO.connect(users[4]).vote(2, 25, false);
        await DAO.connect(users[4]).vote(3, 20, true);
        await DAO.connect(users[4]).vote(4, 5, false);

        await time.increase(oneDay);

        for (let i = 1; i < 4; i++){
            await DAO.connect(users[0]).finish(i);
        }

        const tx = DAO.connect(users[4]);
        await expect(tx.withdraw()).to.be.revertedWith("Not all votings of this voter were finished");
    });

    it("setChairman test: setting users[5] chairman", async function(){
        const {DAO, users, voteToken} = await loadFixture(deploy);
        const tx = await DAO.connect(users[0]).setChairman(users[5].address);
        const isChairman = await DAO.hasRole(await DAO.CHAIRMAN_ROLE(), users[5].address);
        
        await expect(tx).to.emit(DAO, "SetChairman").withArgs(users[0].address, users[5].address);
        await expect(isChairman).to.be.true;
    });

    it("setChairman test: trying to set users[6] chairman as non-admin", async function(){
        const {DAO, users, voteToken} = await loadFixture(deploy);
        const tx = await DAO.connect(users[5]);

        await expect(tx.setChairman(users[6].address)).to.be.reverted;
    });
});