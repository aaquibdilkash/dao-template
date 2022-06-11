const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const {
    FUNC,
    PROPOSAL_DESCRIPTION,
    NEW_STORE_VALUE,
    VOTING_DELAY,
    VOTING_PERIOD,
    SET_VOTING_PERIOD,
    NEW_VOTING_PERIOD,
    CHANGE_VOTING_PERIOD_PROPOSAL_DESCRIPTION,
    MIN_DELAY,
    SET_VOTING_DELAY,
    NEW_VOTING_DELAY,
    CHANGE_VOTING_DELAY_PROPOSAL_DESCRIPTION,
    NEW_MIN_DELAY,
    SET_MIN_DELAY,
    CHANGE_MIN_DELAY_PROPOSAL_DESCRIPTION,
} = require("../../helper-hardhat-config")
const { moveBlocks } = require("../../utils/move-blocks")
const { moveTime } = require("../../utils/move-time")

describe("Governor Flow-------------------------------------------------", async () => {
    let governor
    let governanceToken
    let timeLock
    let box
    let deployer
    let user1
    // const [deployer, user1, _] = await ethers.getSigners()
    const voteWay = 1 // for
    const voteAgainst = 0 // against
    const reason = "decentralization rocks"
    beforeEach(async () => {
        // ;({ deployer, user1 } = await getNamedAccounts())
        ;[deployer, user1] = await ethers.getSigners()
        await deployments.fixture(["all"])
        governor = await ethers.getContract("GovernorContract", deployer.address)
        timeLock = await ethers.getContract("TimeLock")
        governanceToken = await ethers.getContract("GovernanceToken")
        console.log(await (await governanceToken.balanceOf(user1.address)).toString(), "balance")
        box = await ethers.getContract("Box")
    })

    describe("Propose, Vote, Queue and Execute Tests-------------------------------------------------", () => {
        it("can only be changed through governance--------------------------------------------------------------------------", async () => {
            await expect(box.store(55)).to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("proposes, votes, waits, queues, and then executes----------------------------------------------------------------", async () => {
            // propose

            // in front end using ethers
            // let ABI = ["function transfer(address to, uint amount)"]
            // let iface = new ethers.utils.Interface(ABI)
            // iface.encodeFunctionData(FUNC, [NEW_STORE_VALUE])

            const encodedFunctionCall = box.interface.encodeFunctionData(FUNC, [NEW_STORE_VALUE])
            const proposeTx = await governor.propose(
                [box.address],
                [0],
                [encodedFunctionCall],
                PROPOSAL_DESCRIPTION
            )

            const proposeReceipt = await proposeTx.wait(1)
            const proposalId = proposeReceipt.events[0]?.args?.proposalId
            let proposalState = await governor.state(proposalId)
            console.log(`Current Proposal State: ${proposalState}`)

            await moveBlocks(VOTING_DELAY + 1)

            // vote
            const voteTx = await governor.castVoteWithReason(proposalId, voteWay, reason)
            await voteTx.wait(1)
            proposalState = await governor.state(proposalId)
            assert.equal(proposalState.toString(), "1")
            console.log(`Current Proposal State: ${proposalState}`)
            await moveBlocks(VOTING_PERIOD + 1)

            // queue & execute
            // const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION))
            const descriptionHash = ethers.utils.id(PROPOSAL_DESCRIPTION)
            const queueTx = await governor.queue(
                [box.address],
                [0],
                [encodedFunctionCall],
                descriptionHash
            )
            await queueTx.wait(1)
            await moveTime(MIN_DELAY + 1)
            await moveBlocks(1)

            proposalState = await governor.state(proposalId)
            console.log(`Current Proposal State: ${proposalState}`)

            console.log("Executing...")

            const exTx = await governor.execute(
                [box.address],
                [0],
                [encodedFunctionCall],
                descriptionHash
            )
            await exTx.wait(1)
            console.log((await box.retrieve()).toString())
        })

        it("changes voting period------------------------------------------------------------------------", async () => {
            const encodedFunctionCall = governor.interface.encodeFunctionData(SET_VOTING_PERIOD, [
                NEW_VOTING_PERIOD,
            ])
            const proposeTx = await governor.propose(
                [governor.address],
                [0],
                [encodedFunctionCall],
                CHANGE_VOTING_PERIOD_PROPOSAL_DESCRIPTION
            )

            const proposeReceipt = await proposeTx.wait(1)

            const proposalId = proposeReceipt.events[0]?.args?.proposalId

            let proposalState = await governor.state(proposalId)

            console.log(`Current Proposal State: ${proposalState}`)

            await moveBlocks(VOTING_DELAY + 1)

            // vote
            const voteTx = await governor.castVoteWithReason(proposalId, voteWay, reason)
            await voteTx.wait(1)
            proposalState = await governor.state(proposalId)
            assert.equal(proposalState.toString(), "1")
            console.log(`Current Proposal State: ${proposalState}`)
            await moveBlocks(VOTING_PERIOD + 1)

            // queue & execute
            // const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION))
            const descriptionHash = ethers.utils.id(CHANGE_VOTING_PERIOD_PROPOSAL_DESCRIPTION)
            const queueTx = await governor.queue(
                [governor.address],
                [0],
                [encodedFunctionCall],
                descriptionHash
            )
            await queueTx.wait(1)
            await moveTime(MIN_DELAY + 1)
            await moveBlocks(1)

            proposalState = await governor.state(proposalId)
            console.log(`Current Proposal State: ${proposalState}`)

            console.log("Executing...")
            // console.log
            const exTx = await governor.execute(
                [governor.address],
                [0],
                [encodedFunctionCall],
                descriptionHash
            )
            await exTx.wait(1)
            expect((await governor.votingPeriod()).toString()).to.equal("7")
        })
        it("changes voting delay-------------------------------------------------------------------------", async () => {
            const encodedFunctionCall = governor.interface.encodeFunctionData(SET_VOTING_DELAY, [
                NEW_VOTING_DELAY,
            ])
            const proposeTx = await governor.propose(
                [governor.address],
                [0],
                [encodedFunctionCall],
                CHANGE_VOTING_DELAY_PROPOSAL_DESCRIPTION
            )

            const proposeReceipt = await proposeTx.wait(1)

            const proposalId = proposeReceipt.events[0]?.args?.proposalId

            let proposalState = await governor.state(proposalId)

            console.log(`Current Proposal State: ${proposalState}`)

            await moveBlocks(VOTING_DELAY + 1)

            // vote
            const voteTx = await governor.castVoteWithReason(proposalId, voteWay, reason)
            await voteTx.wait(1)
            proposalState = await governor.state(proposalId)
            assert.equal(proposalState.toString(), "1")
            console.log(`Current Proposal State: ${proposalState}`)
            await moveBlocks(VOTING_PERIOD + 1)

            // queue & execute
            // const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION))
            const descriptionHash = ethers.utils.id(CHANGE_VOTING_DELAY_PROPOSAL_DESCRIPTION)
            const queueTx = await governor.queue(
                [governor.address],
                [0],
                [encodedFunctionCall],
                descriptionHash
            )
            await queueTx.wait(1)
            await moveTime(MIN_DELAY + 1)
            await moveBlocks(1)

            proposalState = await governor.state(proposalId)
            console.log(`Current Proposal State: ${proposalState}`)

            console.log("Executing...")
            // console.log
            const exTx = await governor.execute(
                [governor.address],
                [0],
                [encodedFunctionCall],
                descriptionHash
            )
            await exTx.wait(1)
            expect((await governor.votingDelay()).toString()).to.equal("2")
        })
        it("changes minimum delay--------------------------------------------------------------------------", async () => {
            const encodedFunctionCall = timeLock.interface.encodeFunctionData(SET_MIN_DELAY, [
                NEW_MIN_DELAY,
            ])
            const proposeTx = await governor.propose(
                [timeLock.address],
                [0],
                [encodedFunctionCall],
                CHANGE_MIN_DELAY_PROPOSAL_DESCRIPTION
            )

            const proposeReceipt = await proposeTx.wait(1)

            const proposalId = proposeReceipt.events[0]?.args?.proposalId

            let proposalState = await governor.state(proposalId)

            console.log(`Current Proposal State: ${proposalState}`)

            await moveBlocks(VOTING_DELAY + 1)

            // vote
            const voteTx = await governor.castVoteWithReason(proposalId, voteWay, reason)
            await voteTx.wait(1)
            proposalState = await governor.state(proposalId)
            assert.equal(proposalState.toString(), "1")
            console.log(`Current Proposal State: ${proposalState}`)
            await moveBlocks(VOTING_PERIOD + 1)

            // queue & execute
            // const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION))
            const descriptionHash = ethers.utils.id(CHANGE_MIN_DELAY_PROPOSAL_DESCRIPTION)
            const queueTx = await governor.queue(
                [timeLock.address],
                [0],
                [encodedFunctionCall],
                descriptionHash
            )
            await queueTx.wait(1)
            await moveTime(MIN_DELAY + 1)
            await moveBlocks(1)

            proposalState = await governor.state(proposalId)
            console.log(`Current Proposal State: ${proposalState}`)

            console.log("Executing...")
            // console.log
            const exTx = await governor.execute(
                [timeLock.address],
                [0],
                [encodedFunctionCall],
                descriptionHash
            )
            await exTx.wait(1)
            expect((await timeLock.getMinDelay()).toString()).to.equal("7200")
        })
    })

    describe("Cancellation of proposals-----------------------------------------------------", () => {
        let descriptionHash
        let encodedFunctionCall
        let proposalId
        beforeEach(async () => {
            console.log((await governor.votingPeriod()).toString(), "voting period before change")

            encodedFunctionCall = governor.interface.encodeFunctionData(SET_VOTING_PERIOD, [
                NEW_VOTING_PERIOD,
            ])
            const proposeTx = await governor
                .connect(user1)
                .propose(
                    [governor.address],
                    [0],
                    [encodedFunctionCall],
                    CHANGE_VOTING_PERIOD_PROPOSAL_DESCRIPTION
                )

            const proposeReceipt = await proposeTx.wait(1)

            proposalId = proposeReceipt.events[0]?.args?.proposalId

            let proposalState = await governor.state(proposalId)

            console.log(`Current Proposal State: ${proposalState}`)

            descriptionHash = ethers.utils.id(CHANGE_VOTING_PERIOD_PROPOSAL_DESCRIPTION)
        })
        it("proposer should be able to cancels a proposal------------------------------------------------------------------------", async () => {
            const cancelTx = await governor
                .connect(user1)
                .cancel([governor.address], [0], [encodedFunctionCall], descriptionHash)

            const cancelReceipt = await cancelTx.wait(1)

            expect(cancelReceipt.events[0]?.args?.proposalId.toString()).to.be.equal(
                proposalId.toString()
            )

            await moveBlocks(VOTING_DELAY + 1)

            // vote
            await expect(
                governor.castVoteWithReason(proposalId, voteWay, reason)
            ).to.be.revertedWith("Governor: vote not currently active")
        })

        it("only proposer should be able to cancels a proposal------------------------------------------------------------------------", async () => {
            await expect(
                governor
                    .connect(deployer)
                    .cancel([governor.address], [0], [encodedFunctionCall], descriptionHash)
            ).to.be.revertedWith("GovernorContract__NotProposer()")
        })
    })
})
