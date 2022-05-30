const {verify} = require("../helper-functions")
const { networkConfig, developmentChains, MIN_DELAY, addressFile } = require("../helper-hardhat-config")
const fs = require("fs")

const deployTimeLock = async function (hre) {
  // @ts-ignore
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  log("----------------------------------------------------")
  log("Deploying TimeLock and waiting for confirmations...")
  const timeLock = await deploy("TimeLock", {
    from: deployer,
    args: [MIN_DELAY, [], []],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
  })
  log(`TimeLock at ${timeLock.address}`)
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(timeLock.address, [MIN_DELAY, [], []], "contracts/governance_standard/TimeLock.sol:TimeLock")
  }

  let address = JSON.parse(fs.readFileSync(addressFile, "utf8"))
  const chainId = network.config.chainId?.toString()
  address[chainId].timelockContractAddress = timeLock.address
  fs.writeFileSync(addressFile, JSON.stringify(address))

}

module.exports = deployTimeLock
deployTimeLock.tags = ["all", "timelock"]
