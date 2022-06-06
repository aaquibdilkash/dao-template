const fs = require("fs")
const { addressFile } = require("../helper-hardhat-config")
const { network } = require("hardhat")

const saveAddresses = async (addressType, contractAddress) => {
    console.log("saving addresses...")
    try {
        let address = JSON.parse(fs.readFileSync(addressFile, "utf8"))
        const chainName = network.name
        if (!(chainName in address)) {
            address[chainName] = {
                governanceTokenContractAddress: "",
                timelockContractAddress: "",
                governerContractAddress: "",
                mainContractAddress: "",
            }
        }
        address[chainName][`${addressType}`] = contractAddress
        fs.writeFileSync(addressFile, JSON.stringify(address))
    } catch (e) {
        console.log(e)
    }
}

module.exports = { saveAddresses }
