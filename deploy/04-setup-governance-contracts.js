const { networkConfig, developmentChains, ADDRESS_ZERO } = require("../helper-hardhat-config")
const { ethers } = require("hardhat")

const setupContracts = async function (hreconst) {
    // @ts-ignore
    const { getNamedAccounts, deployments, network } = hre
    const { log } = deployments
    const { deployer } = await getNamedAccounts()
    const timeLock = await ethers.getContract("TimeLock", deployer)
    const governor = await ethers.getContract("GovernorContract", deployer)

    log("----------------------------------------------------")
    log("Setting up contracts for roles...")
    // would be great to use multicall here...
    const proposerRole = await timeLock.PROPOSER_ROLE()
    const executorRole = await timeLock.EXECUTOR_ROLE()
    const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE()
    const cancellerRole = await timeLock.CANCELLER_ROLE()

    // set proposer role to governor
    const proposerTx = await timeLock.grantRole(proposerRole, governor.address)
    await proposerTx.wait(1)

    // set executor role to everybody
    const executorTx = await timeLock.grantRole(executorRole, ADDRESS_ZERO)
    await executorTx.wait(1)

    // set canceller role
    // const cancellerTx = await timeLock.grantRole(cancellerRole, deployer)
    // await cancellerTx.wait(1)

    // revoke deployer's admin role
    const revokeTx = await timeLock.revokeRole(adminRole, deployer)
    await revokeTx.wait(1)
    // Guess what? Now, anything the timelock wants to do has to go through the governance process!
}

module.exports = setupContracts
setupContracts.tags = ["all", "setup"]
