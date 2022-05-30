const { verify } = require("../helper-functions")
const {
  networkConfig,
  developmentChains,
  QUORUM_PERCENTAGE,
  VOTING_PERIOD,
  VOTING_DELAY,
  addressFile,
} = require("../helper-hardhat-config")
const fs = require("fs")

const deployGovernorContract = async function (hre) {
  // @ts-ignore
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log, get } = deployments
  const { deployer } = await getNamedAccounts()
  const governanceToken = await get("GovernanceToken")
  const timeLock = await get("TimeLock")

  log("----------------------------------------------------")
  log("Deploying GovernorContract and waiting for confirmations...")
  const governorContract = await deploy("GovernorContract", {
    from: deployer,
    args: [
      governanceToken.address,
      timeLock.address,
      QUORUM_PERCENTAGE,
      VOTING_PERIOD,
      VOTING_DELAY,
    ],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
  })
  log(`GovernorContract at ${governorContract.address}`)
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(governorContract.address, [
      governanceToken.address,
      timeLock.address,
      QUORUM_PERCENTAGE,
      VOTING_PERIOD,
      VOTING_DELAY,
    ], "contracts/governance_standard/GovernorContract.sol:GovernorContract")
  }

  let address = JSON.parse(fs.readFileSync(addressFile, "utf8"))
  const chainId = network.config.chainId?.toString()
  address[chainId].governerContractAddress = governorContract.address
  fs.writeFileSync(addressFile, JSON.stringify(address))
}

module.exports = deployGovernorContract
deployGovernorContract.tags = ["all", "governor"]
