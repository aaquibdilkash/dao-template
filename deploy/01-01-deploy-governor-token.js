const { verify } = require("../utils/verify")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { ethers } = require("hardhat")
const { saveAddresses } = require("../utils/saveAddresses")
const { parseEther, formatEther } = require("ethers/lib/utils")

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

    let balanceOfDelegatedAccount = await governanceToken.balanceOf(delegatedAccount)

    console.log("Deployer Delegating to self---------------------------------------------")
    const transactionResponse = await governanceToken.delegate(delegatedAccount)
    await transactionResponse.wait(1)
    console.log("Deployer Delegating to self Success---------------------------------------------")

    console.log(`Checkpoints: ${await governanceToken.numCheckpoints(delegatedAccount)}`)

    balanceOfDelegatedAccount = await governanceToken.balanceOf(delegatedAccount)

    let balanceOfUserAccount = await governanceToken.balanceOf(userAccount)
    console.log(
        `balance of userAccount: ${userAccount} is ${formatEther(balanceOfUserAccount.toString())}`
    )

    console.log("start transferring")
    const tranferResponse = await governanceToken.transfer(userAccount, parseEther("600000"))
    await tranferResponse.wait(1)
    console.log("transferred")

    governanceToken = await ethers.getContractAt(
        "GovernanceToken",
        governanceTokenAddress,
        userAccount
    )
    const delegateSelfResponse = await governanceToken.delegate(userAccount)
    await delegateSelfResponse.wait(1)

    console.log(`Checkpoints: ${await governanceToken.numCheckpoints(delegatedAccount)}`)

    balanceOfUserAccount = await governanceToken.balanceOf(userAccount)
    console.log(
        `balance of userAccount: ${userAccount} is ${formatEther(balanceOfUserAccount.toString())}`
    )

    balanceOfDelegatedAccount = await governanceToken.balanceOf(delegatedAccount)
    console.log(
        `balance of deployerAccount: ${delegatedAccount} is ${formatEther(
            balanceOfDelegatedAccount.toString()
        )}`
    )
}

module.exports = deployGovernanceToken
deployGovernanceToken.tags = ["all", "governor"]
