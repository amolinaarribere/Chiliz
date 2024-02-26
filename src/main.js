"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// configuration
const BAR_TOKEN_ADDRESS = process.env.BAR_TOKEN_ADDRESS; // ERC20 Smart contract address
const ADDRESSES_TO_CHECK_LIST = process.env.ADDRESSES_TO_CHECK_LIST; // List of address to check in the "frmo" and "to" fields of a transaction
const YEARS_TO_CHECK = process.env.YEARS_TO_CHECK; // number of years to check
const JSON_RPC_PROVIDER_URL = process.env.JSON_RPC_PROVIDER_URL;
const YEARS_TO_CHECK_IN_SECONDS = YEARS_TO_CHECK ? parseInt(YEARS_TO_CHECK) * 365 * 24 * 60 * 60 : 0; // Assuming every year is 365 days long (no leap years)
const BAR_ABI = ["event Transfer(address indexed _from, address indexed _to, uint256 _value)"];
const SECONDS_PER_BLOCK = 12; // numbers of seconds between two consecutives blocks in Ethereum
const ADDRESSES_TO_CHECK = ADDRESSES_TO_CHECK_LIST === null || ADDRESSES_TO_CHECK_LIST === void 0 ? void 0 : ADDRESSES_TO_CHECK_LIST.split(',');
const provider = new ethers_1.ethers.providers.JsonRpcProvider(JSON_RPC_PROVIDER_URL);
const tokenContract = new ethers_1.ethers.Contract(BAR_TOKEN_ADDRESS, BAR_ABI, provider);
/**
 * @abstract Gets the block number of the block mined "X" years in the past
 * Starting from the latest block timestamp instead of the actual current time for simplification
 *
 * @returns the block id X years ago
 *  */
function getFirstBlockNumbers() {
    return __awaiter(this, void 0, void 0, function* () {
        const currentBlockNumber = yield provider.getBlockNumber();
        const firstBlockNumber = currentBlockNumber - (YEARS_TO_CHECK_IN_SECONDS / SECONDS_PER_BLOCK);
        return firstBlockNumber;
    });
}
/**
 * @returns The list of events where "from" or "to" belongs to the address list
 */
function getTransferEvents() {
    return __awaiter(this, void 0, void 0, function* () {
        const firstBlockNumber = yield getFirstBlockNumbers();
        // Looking for the events that have a "from" address from the list 
        const transferFromFilter = tokenContract.filters.Transfer(ADDRESSES_TO_CHECK);
        const transferFromEvents = yield tokenContract.queryFilter(transferFromFilter, firstBlockNumber);
        // In order to avoid getting twice the transactions where the "from" and "to" addresses are in the list, we remove them from the "from" list of transactions
        const transferFromFiltered = transferFromEvents.filter(event => !(ADDRESSES_TO_CHECK.includes(event.args.to)));
        // Looking for the events that have a "to" address from the list 
        const transferToFilter = tokenContract.filters.Transfer(null, ADDRESSES_TO_CHECK);
        const transferToEvents = yield tokenContract.queryFilter(transferToFilter, firstBlockNumber);
        // Returns all the extracted events ("from" and "to")
        return transferFromFiltered.concat(transferToEvents);
    });
}
// Main
getTransferEvents()
    .then(events => {
    console.log(events);
})
    .catch(error => {
    console.error(error);
});
