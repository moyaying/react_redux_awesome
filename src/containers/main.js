import React, {Component} from "react";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import {connect} from "react-redux";
import {withStyles} from "@material-ui/core";
import getWeb3 from "../getWeb3";

// const sigUtil = require('eth-sig-util')
import {
    encrypt,
    recoverPersonalSignature,
    recoverTypedSignatureLegacy,
    recoverTypedSignature,
    recoverTypedSignature_v4
} from 'eth-sig-util'

import {requestDemoData, DemoActions} from "../actions";

const styles = theme => ({
    root: {
        flex: 1,
        color: "#ff0000"
    }
});

// The minimum ABI to get ERC20 Token balance
let minABI = [
    // balanceOf
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    // decimals
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    }
];


class Main extends Component {

    constructor(props) {
        super(props);
        this.state = {web3Msg: ''}
    }

    _makeTypeMsg2 = () => {
        const domain = [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
            { name: "salt", type: "bytes32" },
        ];
        const bid = [
            { name: "amount", type: "uint256" },
            { name: "bidder", type: "Identity" },
        ];
        const identity = [
            { name: "userId", type: "uint256" },
            { name: "wallet", type: "address" },
        ];

        const domainData = {
            name: "My amazing dApp",
            version: "2",
            chainId: 128,
            verifyingContract: "0x1C56346CD2A2Bf3202F771f50d3D14a367B48070",
            salt: "0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558"
        };
        var message = {
            amount: 100,
            bidder: {
                userId: 323,
                wallet: "0x3333333333333333333333333333333333333333"
            }
        };

        /*const data = JSON.stringify({
            types: {
                EIP712Domain: domain,
                Bid: bid,
                Identity: identity,
            },
            domain: domainData,
            primaryType: "Bid",
            message: message
        });*/

        const data = JSON.stringify({
            "types": {
                "EIP712Domain": [
                    { "name": "name", "type": "string" },
                    { "name": "version", "type": "string" },
                    { "name": "verifyingContract", "type": "address" }
                ],
                "RelayRequest": [
                    { "name": "target", "type": "address" },
                    { "name": "encodedFunction", "type": "bytes" },
                    { "name": "gasData", "type": "GasData" },
                    { "name": "relayData", "type": "RelayData" }
                ],
                "GasData": [
                    { "name": "gasLimit", "type": "uint256" },
                    { "name": "gasPrice", "type": "uint256" },
                    { "name": "pctRelayFee", "type": "uint256" },
                    { "name": "baseRelayFee", "type": "uint256" }
                ],
                "RelayData": [
                    { "name": "senderAddress", "type": "address" },
                    { "name": "senderNonce", "type": "uint256" },
                    { "name": "relayWorker", "type": "address" },
                    { "name": "paymaster", "type": "address" }
                ]
            },
            "domain": {
                "name": "GSN Relayed Transaction",
                "version": "1",
                "chainId": 128,
                "verifyingContract": "0x6453D37248Ab2C16eBd1A8f782a2CBC65860E60B"
            },
            "primaryType": "RelayRequest",
            "message": {
                "target": "0x9cf40ef3d1622efe270fe6fe720585b4be4eeeff",
                "encodedFunction":
                    "0xa9059cbb0000000000000000000000002e0d94754b348d208d64d52d78bcd443afa9fa520000000000000000000000000000000000000000000000000000000000000007",
                "gasData": { "gasLimit": "39507", "gasPrice": "1700000000", "pctRelayFee": "70", "baseRelayFee": "0" },
                "relayData": {
                    "senderAddress": "0x22d491bde2303f2f43325b2108d26f1eaba1e32b",
                    "senderNonce": "3",
                    "relayWorker": "0x3baee457ad824c94bd3953183d725847d023a2cf",
                    "paymaster": "0x957F270d45e9Ceca5c5af2b49f1b5dC1Abb0421c"
                }
            }
        });
        return data;
    }

    _makeMsg = (from, to) => {
        return {
            "types": {
                "EIP712Domain": [
                    {"name": "name", "type": "string"},
                    {"name": "version", "type": "string"},
                    {"name": "chainId", "type": "uint256"},
                    {"name": "verifyingContract", "type": "address"}],
                "Person": [
                    {"name": "name", "type": "string"},
                    {"name": "wallet", "type": "address"}],
                "Mail": [
                    {"name": "from", "type": "Person"},
                    {"name": "to", "type": "Person"},
                    {
                        "name": "contents", "type": "string"
                    }]
            },
            "primaryType": "Mail",
            "domain": {
                "name": "Ether Mail",
                "version": "1",
                "chainId": 1,
                "verifyingContract": "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
            },
            "message": {
                "from": {"name": "Cow", "wallet": from},    // Person
                "to": {"name": "Bob", "wallet": to},      // Person
                "contents": "Hello, Bob!"
            }
        }
    }

    _makeTypeMsg = () => {
        return {
            "types": {
                "EIP712Domain": [
                    { "name": "name", "type": "string" },
                    { "name": "version", "type": "string" },
                    { "name": "verifyingContract", "type": "address" }
                ],
                "RelayRequest": [
                    { "name": "target", "type": "address" },
                    { "name": "encodedFunction", "type": "bytes" },
                    { "name": "gasData", "type": "GasData" },
                    { "name": "relayData", "type": "RelayData" }
                ],
                "GasData": [
                    { "name": "gasLimit", "type": "uint256" },
                    { "name": "gasPrice", "type": "uint256" },
                    { "name": "pctRelayFee", "type": "uint256" },
                    { "name": "baseRelayFee", "type": "uint256" }
                ],
                "RelayData": [
                    { "name": "senderAddress", "type": "address" },
                    { "name": "senderNonce", "type": "uint256" },
                    { "name": "relayWorker", "type": "address" },
                    { "name": "paymaster", "type": "address" }
                ]
            },
            "domain": {
                "name": "GSN Relayed Transaction",
                "version": "1",
                "chainId": 42,
                "verifyingContract": "0x6453D37248Ab2C16eBd1A8f782a2CBC65860E60B"
            },
            "primaryType": "RelayRequest",
            "message": {
                "target": "0x9cf40ef3d1622efe270fe6fe720585b4be4eeeff",
                "encodedFunction":
                    "0xa9059cbb0000000000000000000000002e0d94754b348d208d64d52d78bcd443afa9fa520000000000000000000000000000000000000000000000000000000000000007",
                "gasData": { "gasLimit": "39507", "gasPrice": "1700000000", "pctRelayFee": "70", "baseRelayFee": "0" },
                "relayData": {
                    "senderAddress": "0x22d491bde2303f2f43325b2108d26f1eaba1e32b",
                    "senderNonce": "3",
                    "relayWorker": "0x3baee457ad824c94bd3953183d725847d023a2cf",
                    "paymaster": "0x957F270d45e9Ceca5c5af2b49f1b5dC1Abb0421c"
                }
            }
        }
    }

    _makeTypeMsg3 = () => {
        return JSON.stringify({
            types:{
                EIP712Domain:[
                    {name:"name",type:"string"},
                    {name:"version",type:"string"},
                    {name:"chainId",type:"uint256"},
                    {name:"verifyingContract",type:"address"}
                ],
                Person:[
                    {name:"age",type:"uint64"},
                    {name:"name",type:"string"},
                    {name:"wallet",type:"address"}
                ],
                Mail:[
                    {name:"from",type:"Person"},
                    {name:"to",type:"Person"},
                    {name:"contents",type:"string"},
                    {name: "id", type: "uint256"},
                ]
            },
            primaryType:"Mail",
            domain:{name:"Ether Mail",version:"1",chainId:1,verifyingContract:"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"},
            message:{
                from:{age: 46,name:"Cow",wallet:"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"},
                to:{age: 445711732, name:"Bob",wallet:"0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"},
                contents:"Hello, Bob!",
                id: "18446744073709551617"}
        })
    }

    _onRequestDemoDataClick = () => {
        const {requestDemoData} = this.props;
        requestDemoData();
    };

    componentDidMount() {
        this._onConnectWallet().then(() => {
            console.log('wallet connected');
        });
    }

    _testSignTransaction = async  () => {
        const web3 = this.state.web3
        const from = this.state.accounts[0]
        const to = '0xF3eF871491C0dadCc974e991d58077df0f5b78bd'

        try {
            // https://web3js.readthedocs.io/en/v1.2.0/web3-eth.html#eth-sendtransaction
            let result = await web3.eth.signTransaction({
                from    ,
                to,
                value: web3.utils.toWei('1.2', 'ether'),
                gas: '21000',
                gasPrice: web3.utils.toWei('1', 'gwei'),
                data: '' ,
                // nonce: '1',
                // chainId: '256',
            });
            this.setState({web3Msg: 'signTransaction:' + result})
        } catch (e) {
            this.setState({web3Msg: 'error:' + e.message})
            console.error(e)
        }
    }

    _testSignPersonalMessage = async  () => {
        const web3 = this.state.web3
        const from = this.state.accounts[0]
        // const data = '0x57656c636f6d6520746f204f70656e536561210a0a436c69636b20225369676e2220746f207369676e20696e2e204e6f2070617373776f7264206e6565646564210a0a492061636365707420746865204f70656e536561205465726d73206f6620536572766963653a2068747470733a2f2f6f70656e7365612e696f2f746f730a0a57616c6c657420616464726573733a0a3078356332346131346237393761303162636338656437343039326333313739346464643830666234340a0a4e6f6e63653a0a313931363039'
//titan    result 0x1eca0532dc1bc2a6933d812635b4134a8142fc21533aee544eb34b42744ccc6c002b649c78c43d166a33a16796cac7e38bca593550f72ce8dc4458c50fa81b2625
//metamask result 0x1eca0532dc1bc2a6933d812635b4134a8142fc21533aee544eb34b42744ccc6c002b649c78c43d166a33a16796cac7e38bca593550f72ce8dc4458c50fa81b261b

        // const data = '0x57656c636f6d6520746f204f70656e536561210a0a436c69636b20225369676e2220746f207369676e20696e2e204e6f2070617373776f7264206e6565646564210a0a492061636365707420746865204f70656e536561205465726d73206f6620536572766963653a2068747470733a2f2f6f70656e7365612e696f2f746f730a0a57616c6c657420616464726573733a0a3078356332346131346237393761303162636338656437343039326333313739346464643830666234340a0a4e6f6e63653a0a363137333934'
//titan    result 0xda60c0d3225881e822e0916458a484957c1576e4cc3a514ebe9acdb966d4df337241d9549848f8bac3ebd9c7bb84c676b1c812857d5b5881c5908e5e1119cf7b26
//metamask result 0xda60c0d3225881e822e0916458a484957c1576e4cc3a514ebe9acdb966d4df337241d9549848f8bac3ebd9c7bb84c676b1c812857d5b5881c5908e5e1119cf7b1c

        const data = '0xca96dcaec4f58bb331596b5f5ebc60a0b6745da9155cd056bc6c08e48a87fe0d'
//metamask result 0x9c34258ec7cc6903bebe786d6d7b731186ff428af889ce94678e60755a3edd20026cc8861d4cca1364449a65f36e19134a4a30388fd3a8db4aecc083ca332e271b
        const self = this

        try {
            // https://web3js.readthedocs.io/en/v1.2.0/web3-eth.html#eth-sendtransaction
            let result = await web3.currentProvider.sendAsync({
                method: 'personal_sign',
                params: [from,data],
            }, function (err, result) {
                console.log('wallet _testSignPersonalMessage  function ' + result.jsonrpc + '   ' + result.result);
                // self.setState({web3Msg: result.result})
                if (err) return console.error(err)
                if (result.error) {
                    return console.error(result.error.message)
                }
                self.setState({web3Msg: 'signPersonalMessage:' + result.result})
            })
            console.log('wallet _testSignPersonalMessage' + result);
        } catch (e) {
            this.setState({web3Msg: 'error:' + e.message})
            console.error(e)
        }
    }

    _testEthCall = async () => {
        try {
            const web3 = this.state.web3
            const from = this.state.accounts[0]
            const listStr = ['aaa','bbb'].toString()

            // Get ERC20 Token contract instance
            // let tokenContractAddress = '0x0298c2b32eae4da002a15f36fdf7615bea3da047'   //heco mainnet husd
            let tokenContractAddress = '0x3aC19481FAce71565155F370B3E34A1178745382'  //heco test hyn
            let contract = new web3.eth.Contract(minABI, tokenContractAddress);
            let tokenBalance = await contract.methods.balanceOf(from).call();
            this.setState({web3Msg: 'tokenBalance:' + tokenBalance})
        } catch (err) {
            this.setState({web3Msg: 'tokenBalanceError:' + err})
        }
    }

    _testGetBalance = async () => {
        const web3 = this.state.web3
        const from = this.state.accounts[0]

        let balance = await web3.eth.getBalance(from);
        this.setState({web3Msg: 'balance:' + balance})
    }

    _testSignTypedMessageOld = async () => {
        const web3 = this.state.web3
        const from = this.state.accounts[0]
        const to = '0xF3eF871491C0dadCc974e991d58077df0f5b78bd'
        // const msgParams = this._makeMsg(from, to)
        const msgParams = this._makeTypeMsg()
        const self = this

        try {
            // see https://eips.ethereum.org/EIPS/eip-712
            console.log('wallet _testSignTypedMessage00   ' + from);
            web3.eth.personal.signTypedData(
                msgParams,
                from).then(console.log);
        } catch (e) {
            this.setState({web3Msg: 'error:' + e.message})
            console.error(e)
        }
    }

    _testSignTypedMessage = async () => {
        const web3 = this.state.web3
        const from = this.state.accounts[0]
        const to = '0xF3eF871491C0dadCc974e991d58077df0f5b78bd'
        // const msgParams = this._makeMsg(from, to)
        const msgParams = this._makeTypeMsg2()
        const self = this

        try {
            // see https://eips.ethereum.org/EIPS/eip-712
            console.log('wallet _testSignTypedMessage00   ' + from);
            web3.currentProvider.sendAsync({
                method: 'eth_signTypedData_v3',
                params: [from, msgParams],
                from: from
            }, function (err, result) {
                // self.setState({web3Msg: result.result})
                if (err) return console.error(err)
                if (result.error) {
                    return console.error(result.error)
                }
                console.log(result.result)
                self.setState({web3Msg: 'signTypeMessage:' + result.result})
                /*const recovered = recoverTypedSignature({
                    data: msgParams,
                    sig: result.result
                })
                console.log('wallet _testSignTypedMessage' + result.result + "  " + recovered);
                if (recovered.toLowerCase() === from.toLowerCase()) {
                    alert('Recovered success: ' + from)
                } else {
                    alert('Failed to verify signer, got: ' + recovered)
                }*/
            })
        } catch (e) {
            this.setState({web3Msg: 'error:' + e.message})
            console.error(e)
        }
    }

    _onConnectWallet = async () => {
        try {
            // Get network provider and web3 instance.
            const web3 = await getWeb3();

            // Use web3 to get the user's accounts.
            const accounts = await window.ethereum.enable();

            // Set web3, accounts, and contract to the state, and then proceed with an
            // example of interacting with the contract's methods.
            this.setState({web3, accounts});
        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts. Check console for details.` + error,
            );
            console.error(error);
        }
    }

    render() {
        const {classes, demoState} = this.props;
        return (
            <Typography component="div" className={classes.root}>
                <Box m={2}>
                    <Box fontSize="h6.fontSize">hello demo</Box>
                    <Box>data: {demoState.data}</Box>
                    <Box>msg: {demoState.msg}</Box>
                    <Box>status: {demoState.status}</Box>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this._onRequestDemoDataClick}
                    >
                        Request Demo Data
                    </Button>

                    <Box>😊😊😊</Box>

                    <Box>address: {this.state.accounts ? this.state.accounts : 'please connect wallet'}</Box>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this._onConnectWallet}
                    >
                        Connect wallet
                    </Button>

                    <Box>😊</Box>

                    <Box>{this.state.web3Msg}</Box>

                    <Box>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this._testEthCall}
                        >
                            ethCall
                        </Button>
                    </Box>

                    <Box>😊</Box>

                    <Box>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this._testGetBalance}
                        >
                            getBalance
                        </Button>
                    </Box>

                    <Box>😊</Box>

                    <Box>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this._testSignTypedMessage}
                        >
                            signTypedMessage
                        </Button>
                    </Box>

                    <Box>😊</Box>

                    <Box>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this._testSignTransaction}
                        >
                            signTransaction
                        </Button>
                    </Box>

                    <Box>😊</Box>

                    <Box>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this._testSignPersonalMessage}
                        >
                            signPersonalMessage
                        </Button>
                    </Box>
                </Box>
            </Typography>
        );
    }
}

const mapStateToProps = (state, onwProps) => ({
    demoState: state.demo
});

const mapDispatchToProps = {
    requestDemoData: DemoActions.requestDemoData
};

//see https://react-redux.js.org/api/connect
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(styles)(Main));
