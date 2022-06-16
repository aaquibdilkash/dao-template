const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { formatEther, parseEther, keccak256 } = require("ethers/lib/utils")
const { MerkleTree } = require("merkletreejs")

describe("Airdrop-------------------------------------------------", async () => {
    let governanceToken
    let airdrop
    let deployer
    let user1
    let TOKENS_IN_POOL
    let REWARD_AMOUNT
    let addrs
    let contractBlocknumber
    let blockNumberCutoff // Any account that participated before or including this blocknumber are eligible for airdrop.
    let totalParticipated
    let leafNodes
    let merkleTree
    let rootHash
    let airdropAmount
    beforeEach(async () => {
        addrs = await ethers.getSigners()
        deployer = addrs[0]
        user1 = addrs[1]
        await deployments.fixture(["all"])
        governanceToken = await ethers.getContract("GovernanceToken", deployer.address)
        airdrop = await ethers.getContract("AirDrop")
        totalParticipated = 10
        airdropAmount = "100000"
    })

    describe("Claim AirDrop Reward-----------------------------------------------------", () => {
        beforeEach(async () => {
            await Promise.all(
                addrs.slice(0, totalParticipated).map(async (account) => {
                    expect(await airdrop.connect(account).participate())
                        .to.emit(airdrop, "Participated")
                        .withArgs(account.address)
                })
            )

            // Query all Participate events between contract block number to block number cut off on the ethSwap contract
            // to find out all the accounts that have interacted with it
            const filter = airdrop.filters.Participated()
            const results = await airdrop.queryFilter(
                filter
                // contractBlocknumber,
                // blockNumberCutoff
            )

            expect(results.length).to.eq(totalParticipated)

            // Get elligble addresses from events and then hash them to get leaf nodes
            leafNodes = results.map((i) => keccak256(i.args.toString()))
            // Generate merkleTree from leafNodes
            merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true })
            // Get root hash from merkle tree
            rootHash = merkleTree.getRoot()

            // airdrop contract token balance before transfer
            expect(formatEther(await governanceToken.balanceOf(airdrop.address))).to.equal("0.0")

            // transer airdrop amount to airdrop contract
            governanceToken.connect(deployer).transfer(airdrop.address, parseEther(airdropAmount))

            // airdrop contract token balance after transfer
            expect(formatEther(await governanceToken.balanceOf(airdrop.address))).to.equal(
                "100000.0"
            )

            // reward amount according to number of participants and airdrop contract token balance
            REWARD_AMOUNT = (await governanceToken.balanceOf(airdrop.address))
                .div(totalParticipated)
                .toString()

            // initiate the Air Drop contract
            // await airdrop
            //     .connect(deployer)
            //     .initiateAirdrop(rootHash, governanceToken.address, REWARD_AMOUNT)
        })
        it("checks the claim balances-------------------------------------", async () => {
            airdrop
                .connect(deployer)
                .initiateAirdrop(rootHash, governanceToken.address, REWARD_AMOUNT)

            expect(formatEther(await governanceToken.balanceOf(airdrop.address))).to.equal(
                "100000.0"
            )

            await Promise.all(
                addrs.slice(0, totalParticipated).map(async (account) => {
                    const proof = merkleTree.getHexProof(keccak256(account.address))
                    expect(await airdrop.connect(account).claim(proof))
                        .to.emit(airdrop, "Claimed")
                        .withArgs(account.address)
                })
            )

            expect(formatEther(await governanceToken.balanceOf(airdrop.address))).to.equal("0.0")
        })

        it("claim should be reverted if airdrop is not initiated", async () => {
            const proof = merkleTree.getHexProof(keccak256(addrs[10].address))
            await expect(airdrop.connect(addrs[0]).claim(proof)).to.be.revertedWith(
                "AirDrop__NotInitiated()"
            )
        })

        it("only owner should be able to initiate airdrop", async () => {
            await expect(
                airdrop
                    .connect(user1)
                    .initiateAirdrop(rootHash, governanceToken.address, REWARD_AMOUNT)
            ).to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("should not be able to initiate twice", async () => {
            airdrop
                .connect(deployer)
                .initiateAirdrop(rootHash, governanceToken.address, REWARD_AMOUNT)
            await expect(
                airdrop
                    .connect(deployer)
                    .initiateAirdrop(rootHash, governanceToken.address, REWARD_AMOUNT)
            ).to.be.revertedWith("AirDrop__AlreadyInitiated()")
        })
        it("should not be able to participate after initiation", async () => {
            await airdrop
                .connect(deployer)
                .initiateAirdrop(rootHash, governanceToken.address, REWARD_AMOUNT)

            await expect(airdrop.connect(deployer).participate()).to.be.revertedWith(
                "AirDrop__ParticipationEnded()"
            )
        })
        it("should only be able to participate once", async () => {
            await expect(airdrop.connect(deployer).participate()).to.be.revertedWith(
                "AirDrop__AlreadyParticipated()"
            )
        })

        it("addresss who didn't participated should not be able to claim", async () => {
            airdrop
                .connect(deployer)
                .initiateAirdrop(rootHash, governanceToken.address, REWARD_AMOUNT)

            expect(formatEther(await governanceToken.balanceOf(airdrop.address))).to.equal(
                "100000.0"
            )
            await Promise.all(
                addrs.slice(totalParticipated, 20).map(async (account) => {
                    const proof = merkleTree.getHexProof(keccak256(account.address))
                    expect(formatEther(await governanceToken.balanceOf(account.address))).to.equal(
                        "0.0"
                    )
                    await expect(airdrop.connect(account).claim(proof)).to.be.revertedWith(
                        "AirDrop__IncorrectMerkleProof()"
                    )

                    expect(formatEther(await governanceToken.balanceOf(account.address))).to.equal(
                        "0.0"
                    )
                })
            )

            expect(formatEther(await governanceToken.balanceOf(airdrop.address))).to.equal(
                "100000.0"
            )
        })

        it("claim function should be reverted if already claimed", async () => {
            await airdrop
                .connect(deployer)
                .initiateAirdrop(rootHash, governanceToken.address, REWARD_AMOUNT)

            const proof = merkleTree.getHexProof(keccak256(addrs[0].address))

            await expect(airdrop.connect(addrs[0]).claim(proof))
                .to.emit(airdrop, "Claimed")
                .withArgs(addrs[0].address)

            await expect(airdrop.connect(addrs[0]).claim(proof)).to.be.revertedWith(
                "AirDrop__AlreadyClaimed()"
            )
        })
    })
})
