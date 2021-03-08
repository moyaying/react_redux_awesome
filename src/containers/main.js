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

    _onWeb3FunTest = async () => {
        const web3 = this.state.web3
        const from = this.state.accounts[0]
        const to = '0xF3eF871491C0dadCc974e991d58077df0f5b78bd'
        const msgParams = this._makeMsg(from, to)
        const self = this

        try {

            // let netId = await web3.eth.net.getId();
            // self.setState({web3Msg: 'netId:' + netId})
            // return;

            let tx = {
                from,
                to,
                nance: '1',
                chainId: '265',
                gas: '21000',
                gasPrice: '1000000000',
                value: web3.utils.toWei('1.2', 'ether'),
                data: ''
            }
            let signedTx = await web3.eth.signTransaction(tx)
            self.setState({web3Msg: 'signedTx:' + signedTx})
            return;

            // Get ERC20 Token contract instance
            // let tokenContractAddress = '0x0298c2b32eae4da002a15f36fdf7615bea3da047'   //heco mainnet husd
            let tokenContractAddress = '0x1990f4c2D9cbB7587e1864812d0403e52fa32f03'  //heco test hyn
            let contract = new web3.eth.Contract(minABI, tokenContractAddress);
            console.log('xxxx11')
            let tokenBalance = await contract.methods.balanceOf(from).call();
            console.log('xxxx222', tokenBalance.toString())
            self.setState({web3Msg: 'tokenBalance:' + tokenBalance})
            return;

            let balance = await web3.eth.getBalance(from);
            self.setState({web3Msg: 'balance:' + balance})
            return;

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
            console.error(e.stack)
            self.setState({web3Msg: e.stack})
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

                    <Box>address: {this.state.accounts ? this.state.accounts : 'please connect wallet'}</Box>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this._onConnectWallet}
                    >
                        Connect wallet
                    </Button>
                    <Box>web3 console: {this.state.web3Msg}</Box>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this._onWeb3FunTest}
                    >
                        Web3 test
                    </Button>
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
