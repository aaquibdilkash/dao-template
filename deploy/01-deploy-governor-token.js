const { verify } = require("../utils/verify")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { ethers } = require("hardhat")
const { saveAddresses } = require("../utils/saveAddresses")

const deployGovernanceToken = async function (hre) {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer, user1 } = await getNamedAccounts()
    log("----------------------------------------------------")
    log("Deploying GovernanceToken and waiting for confirmations...")

    const governanceToken = await deploy("GovernanceToken", {
        from: deployer,
        args: [],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })
    log(`GovernanceToken at ${governanceToken.address}`)
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(governanceToken.address, [], "contracts/GovernanceToken.sol:GovernanceToken")
    }

    saveAddresses("governanceTokenContractAddress", governanceToken.address)

    log(`Delegating to ${deployer}`)
    await delegate(governanceToken.address, deployer, user1)
    log("Delegated!")
}

const delegate = async (governanceTokenAddress, delegatedAccount, userAccount) => {
    let governanceToken = await ethers.getContractAt(
        "GovernanceToken",
        governanceTokenAddress,
        delegatedAccount
    )
    // let balanceOfContract = await governanceToken.balanceOf(governanceTokenAddress)
    // console.log(`balance of contract: ${governanceTokenAddress} is ${balanceOfContract} before delegating to delegatedAccount`)

    let balanceOfDelegatedAccount = await governanceToken.balanceOf(delegatedAccount)
    console.log(
        `balance of delegatedAccount: ${delegatedAccount} is ${balanceOfDelegatedAccount} before delegation`
    )

    const transactionResponse = await governanceToken.delegate(delegatedAccount)
    await transactionResponse.wait(1)

    // balanceOfContract = await governanceToken.balanceOf(governanceTokenAddress)
    // console.log(`balance of contract: ${governanceTokenAddress} is ${balanceOfContract} after delegating to delegatedAccount`)

    // console.log(`Checkpoints: ${await governanceToken.numCheckpoints(delegatedAccount)}`)
    // console.log(`Checkpoints: ${await governanceToken.numCheckpoints(delegatedAccount)}`)

    balanceOfDelegatedAccount = await governanceToken.balanceOf(delegatedAccount)
    console.log(
        `balance of delegatedAccount: ${delegatedAccount} is ${balanceOfDelegatedAccount} after delegation`
    )

    let balanceOfUserAccount = await governanceToken.balanceOf(userAccount)
    console.log(`balance of userAccount: ${userAccount} is ${balanceOfUserAccount}`)

    console.log("start transferring")
    const tranferResponse = await governanceToken.transfer(userAccount, "600000000000000000000000")
    await tranferResponse.wait(1)
    console.log("transferred")

    governanceToken = await ethers.getContractAt(
        "GovernanceToken",
        governanceTokenAddress,
        userAccount
    )
    const delegateSelfResponse = await governanceToken.delegate(userAccount)
    await delegateSelfResponse.wait(1)

    // console.log(`Checkpoints: ${await governanceToken.numCheckpoints(delegatedAccount)}`)
    // console.log(`Checkpoints: ${await governanceToken.numCheckpoints(delegatedAccount)}`)

    balanceOfUserAccount = await governanceToken.balanceOf(userAccount)
    console.log(`balance of userAccount: ${userAccount} is ${balanceOfUserAccount}`)

    balanceOfDelegatedAccount = await governanceToken.balanceOf(delegatedAccount)
    console.log(`balance of ${delegatedAccount} is ${balanceOfDelegatedAccount}`)
}

module.exports = deployGovernanceToken
deployGovernanceToken.tags = ["all", "governor"]
