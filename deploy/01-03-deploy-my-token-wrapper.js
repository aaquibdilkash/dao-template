const { verify } = require("../utils/verify")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { ethers } = require("hardhat")
const { saveAddresses } = require("../utils/saveAddresses")
const { parseEther, formatEther } = require("ethers/lib/utils")

const deployMyTokenWrapper = async function (hre) {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log, get } = deployments
    const { deployer, user1 } = await getNamedAccounts()
    const myToken = await get("MyToken")
    log("----------------------------------------------------")
    log("Deploying MyTokenWrapper and waiting for confirmations...")

    const myTokenWrapper = await deploy("MyTokenWrapper", {
        from: deployer,
        args: [myToken.address],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })
    log(`MyTokenWrapper at ${myTokenWrapper.address}`)
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(myTokenWrapper.address, [], "contracts/MyTokenWrapper.sol:MyTokenWrapper")
    }

    saveAddresses("myTokenWrapperContractAddress", myTokenWrapper.address)

    log(`Depositing ERC20 for ERC20Votes for ${deployer}`)
    await depositForVotes(myTokenWrapper.address, deployer)
    log("Deposited!")

    log(`Delegating to ${deployer}`)
    await delegate(myTokenWrapper.address, deployer, user1)
    log("Delegated!")
}

const delegate = async (myTokenWrapperAddress, delegatedAccount, userAccount) => {
    let myTokenWrapper = await ethers.getContractAt(
        "MyTokenWrapper",
        myTokenWrapperAddress,
        delegatedAccount
    )

    let balanceOfDelegatedAccount = await myTokenWrapper.balanceOf(delegatedAccount)

    console.log("Deployer Delegating to self---------------------------------------------")
    const transactionResponse = await myTokenWrapper.delegate(delegatedAccount)
    await transactionResponse.wait(1)
    console.log("Deployer Delegating to self Success---------------------------------------------")

    console.log(`Checkpoints: ${await myTokenWrapper.numCheckpoints(delegatedAccount)}`)

    balanceOfDelegatedAccount = await myTokenWrapper.balanceOf(delegatedAccount)

    let balanceOfUserAccount = await myTokenWrapper.balanceOf(userAccount)
    console.log(
        `balance of userAccount: ${userAccount} is ${formatEther(balanceOfUserAccount.toString())}`
    )

    console.log("start transferring")
    const tranferResponse = await myTokenWrapper.transfer(userAccount, parseEther("600000"))
    await tranferResponse.wait(1)
    console.log("transferred")

    myTokenWrapper = await ethers.getContractAt(
        "MyTokenWrapper",
        myTokenWrapperAddress,
        userAccount
    )
    const delegateSelfResponse = await myTokenWrapper.delegate(userAccount)
    await delegateSelfResponse.wait(1)

    console.log(`Checkpoints: ${await myTokenWrapper.numCheckpoints(delegatedAccount)}`)

    balanceOfUserAccount = await myTokenWrapper.balanceOf(userAccount)
    console.log(
        `balance of userAccount: ${userAccount} is ${formatEther(balanceOfUserAccount.toString())}`
    )

    balanceOfDelegatedAccount = await myTokenWrapper.balanceOf(delegatedAccount)
    console.log(
        `balance of deployerAccount: ${delegatedAccount} is ${formatEther(
            balanceOfDelegatedAccount.toString()
        )}`
    )
}

const depositForVotes = async (myTokenWrapperAddress, depositerAccount) => {
    let myTokenWrapper = await ethers.getContract("MyTokenWrapper", depositerAccount)
    let myToken = await ethers.getContract("MyToken", depositerAccount)

    console.log(depositerAccount, parseEther("1000000"))

    await myToken.approve(myTokenWrapperAddress, parseEther("1000000"))
    await myTokenWrapper.depositFor(depositerAccount, parseEther("1000000"))
}

module.exports = deployMyTokenWrapper
deployMyTokenWrapper.tags = ["all", "my-token-wrapper"]
