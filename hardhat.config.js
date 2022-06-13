require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("@nomiclabs/hardhat-ethers")
require("hardhat-gas-reporter")
require("dotenv/config")
require("solidity-coverage")
require("hardhat-deploy")

const MAINNET_RPC_URL =
    process.env.MAINNET_RPC_URL || "https://eth-rinkeby.alchemyapi.io/v2/your-api-key"

const RINKEBY_RPC_URL =
    process.env.RINKEBY_RPC_URL || "https://eth-rinkeby.alchemyapi.io/v2/your-api-key"

const KOVAN_RPC_URL =
    process.env.KOVAN_RPC_URL || "https://eth-rinkeby.alchemyapi.io/v2/your-api-key"

const ROPSTEN_RPC_URL =
    process.env.ROPSTEN_RPC_URL || "https://eth-rinkeby.alchemyapi.io/v2/your-api-key"

const BSC_TESTNET_RPC_URL =
    process.env.BSC_TESTNET_RPC_URL || "https://eth-rinkeby.alchemyapi.io/v2/your-api-key"

const BSC_RPC_URL = process.env.BSC_RPC_URL || "https://eth-rinkeby.alchemyapi.io/v2/your-api-key"

const MNEMONIC = process.env.MNEMONIC || "<mnemonic>"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "<privatKey>"
const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2 || "<privatKey2>"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "<your etherscan api>"
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "<your bscscan api>"
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "<your coinmarketcap api>"

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            forking: {
                url: MAINNET_RPC_URL,
                blockNumber: 14390000,
            },
        },
        localhost: {
            chainId: 31337,
        },
        mainnet: {
            url: MAINNET_RPC_URL,
            accounts: [PRIVATE_KEY, PRIVATE_KEY_2],
            // accounts: {MNEMONIC},
            chainId: 1,
        },
        ropsten: {
            url: ROPSTEN_RPC_URL,
            accounts: [PRIVATE_KEY, PRIVATE_KEY_2],
            // accounts: {MNEMONIC},
            chainId: 3,
        },
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY, PRIVATE_KEY_2],
            // accounts: {MNEMONIC},
            chainId: 4,
        },
        kovan: {
            url: KOVAN_RPC_URL,
            accounts: [PRIVATE_KEY, PRIVATE_KEY_2],
            // accounts: {MNEMONIC},
            chainId: 42,
        },
        bscTestnet: {
            url: BSC_TESTNET_RPC_URL,
            accounts: [PRIVATE_KEY, PRIVATE_KEY_2],
            // accounts: {MNEMONIC},
            chainId: 97,
        },
        bsc: {
            url: BSC_RPC_URL,
            accounts: [PRIVATE_KEY, PRIVATE_KEY_2],
            // accounts: {MNEMONIC},
            chainId: 56,
        },
    },
    solidity: {
        version: "0.8.9",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    etherscan: {
        apiKey: {
            mainnet: ETHERSCAN_API_KEY,
            ropsten: ETHERSCAN_API_KEY,
            rinkeby: ETHERSCAN_API_KEY,
            kovan: ETHERSCAN_API_KEY,
            bscTestnet: BSCSCAN_API_KEY,
            bsc: BSCSCAN_API_KEY,
        },
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
        user1: {
            default: 1,
            1: 1,
        },
    },
    mocha: {
        timeout: 200000, // 200 seconds max for running tests
    },
}
