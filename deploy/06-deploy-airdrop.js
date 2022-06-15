const { verify } = require("../utils/verify")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { ethers } = require("hardhat")
const { saveAddresses } = require("../utils/saveAddresses")

const deployBox = async function (hre) {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    log("----------------------------------------------------")
    log("Deploying Box and waiting for confirmations...")
    const airdrop = await deploy("AirDrop", {
        from: deployer,
        args: [],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })
    log(`Airdrop at ${airdrop.address}`)
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(airdrop.address, [], "contracts/AirDrop.sol:AirDrop")
    }

    saveAddresses("airdropContractAddress", airdrop.address)
}

module.exports = deployBox
deployBox.tags = ["all", "airdrop"]
