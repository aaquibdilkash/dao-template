const { verify } = require("../utils/verify")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { ethers } = require("hardhat")
const { saveAddresses } = require("../utils/saveAddresses")
const { parseEther, formatEther } = require("ethers/lib/utils")

const deployMyToken = async function (hre) {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer, user1 } = await getNamedAccounts()
    log("----------------------------------------------------")
    log("Deploying MyToken and waiting for confirmations...")

    const myToken = await deploy("MyToken", {
        from: deployer,
        args: [],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })
    log(`MyToken at ${myToken.address}`)
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(myToken.address, [], "contracts/MyToken.sol:MyToken")
    }

    saveAddresses("myTokenContractAddress", myToken.address)
}

module.exports = deployMyToken
deployMyToken.tags = ["all", "my-token"]
