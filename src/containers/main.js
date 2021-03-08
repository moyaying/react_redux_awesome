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
            let tx = {
                from,
                to,
                value: web3.utils.toWei('1.2', 'ether'),
                gas: '21000',
                gasPrice: web3.utils.toWei('1', 'gwei'),
                // data: '' ,
                // nonce: '1',
                // chainId: '256',
            }
            let result = await web3.eth.signTransaction(tx, from);
            this.setState({web3Msg: 'signTransaction:' + result})
        } catch (e) {
            this.setState({web3Msg: 'error:' + e.message})
            console.error(e)
        }
    }

    _testEthCall = async () => {
        const web3 = this.state.web3
        const from = this.state.accounts[0]

        // Get ERC20 Token contract instance
        // let tokenContractAddress = '0x0298c2b32eae4da002a15f36fdf7615bea3da047'   //heco mainnet husd
        let tokenContractAddress = '0x1990f4c2D9cbB7587e1864812d0403e52fa32f03'  //heco test hyn
        let contract = new web3.eth.Contract(minABI, tokenContractAddress);
        let tokenBalance = await contract.methods.balanceOf(from).call();
        this.setState({web3Msg: 'tokenBalance:' + tokenBalance})
    }

    _testGetBalance = async () => {
        const web3 = this.state.web3
        const from = this.state.accounts[0]

        let balance = await web3.eth.getBalance(from);
        this.setState({web3Msg: 'balance:' + balance})
    }

    _testSignTypedMessage = async () => {
        const web3 = this.state.web3
        const from = this.state.accounts[0]
        const to = '0xF3eF871491C0dadCc974e991d58077df0f5b78bd'
        const msgParams = this._makeMsg(from, to)
        const self = this

        try {
            // see https://eips.ethereum.org/EIPS/eip-712
            web3.currentProvider.sendAsync({
                method: 'eth_signTypedData',
                params: [from, msgParams],
            }, function (err, result) {
                // self.setState({web3Msg: result.result})
                if (err) return console.error(err)
                if (result.error) {
                    return console.error(result.error.message)
                }
                const recovered = recoverTypedSignature({
                    data: msgParams,
                    sig: result.result
                })
                if (recovered.toLowerCase() === from.toLowerCase()) {
                    alert('Recovered success: ' + from)
                } else {
                    alert('Failed to verify signer, got: ' + recovered)
                }
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
            const accounts = await web3.eth.getAccounts();

            // Set web3, accounts, and contract to the state, and then proceed with an
            // example of interacting with the contract's methods.
            this.setState({web3, accounts});
        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts. Check console for details.`,
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
