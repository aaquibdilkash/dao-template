const networkConfig = {
    localhost: {},
    hardhat: {},
    // Price Feed Address, values can be obtained at https://docs.chain.link/docs/reference-contracts
    // Default one is ETH/USD contract on Kovan
    ropsten: {
        blockConfirmations: 6,
    },
    rinkeby: {
        blockConfirmations: 6,
    },
    kovan: {
        blockConfirmations: 6,
    },
    bscTestnet: {
        blockConfirmations: 6,
    },
    bsc: {
        blockConfirmations: 6,
    },
}

const developmentChains = ["hardhat", "localhost"]
const proposalsFile = "proposals.json"
const addressFile = "address.json"

// Governor Values
const QUORUM_PERCENTAGE = 40 // Need 40% of voters to pass
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"

const MIN_DELAY = 3600 // 1 hour - after a vote passes, you have 1 hour before you can enact
const NEW_MIN_DELAY = 7200 // 2 hour - after a vote passes, you have 2 hour before you can enact
const SET_MIN_DELAY = "updateDelay"
CHANGE_MIN_DELAY_PROPOSAL_DESCRIPTION = "change min delay to 7200 secs"

const NEW_STORE_VALUE = 77
const FUNC = "store"
const PROPOSAL_DESCRIPTION = "Proposal #1 77 in the Box!"

// export const VOTING_PERIOD = 45818 // 1 week - how long the vote lasts. This is pretty long even for local tests
const VOTING_PERIOD = 5 // blocks
const NEW_VOTING_PERIOD = 7 // blocks
const SET_VOTING_PERIOD = "setVotingPeriod"
CHANGE_VOTING_PERIOD_PROPOSAL_DESCRIPTION = "change voting period to 6 blocks"

const VOTING_DELAY = 1 // 1 Block - How many blocks till a proposal vote becomes active
const NEW_VOTING_DELAY = 2 // 1 Block - How many blocks till a proposal vote becomes active
const SET_VOTING_DELAY = "setVotingDelay"
CHANGE_VOTING_DELAY_PROPOSAL_DESCRIPTION = "change voting delay to 2 blocks"

module.exports = {
    networkConfig,
    developmentChains,
    proposalsFile,
    addressFile,
    QUORUM_PERCENTAGE,
    ADDRESS_ZERO,
    NEW_STORE_VALUE,
    FUNC,
    PROPOSAL_DESCRIPTION,
    MIN_DELAY,
    NEW_MIN_DELAY,
    SET_MIN_DELAY,
    CHANGE_MIN_DELAY_PROPOSAL_DESCRIPTION,
    VOTING_PERIOD,
    NEW_VOTING_PERIOD,
    SET_VOTING_PERIOD,
    CHANGE_VOTING_PERIOD_PROPOSAL_DESCRIPTION,
    VOTING_DELAY,
    NEW_VOTING_DELAY,
    SET_VOTING_DELAY,
    CHANGE_VOTING_DELAY_PROPOSAL_DESCRIPTION,
}
