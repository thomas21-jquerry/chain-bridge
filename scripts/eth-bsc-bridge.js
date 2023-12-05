const Web3 = require('web3');
const BridgeEth = require('../build/contracts/BridgeEth.json');
const BridgeBsc = require('../build/contracts/BridgeBsc.json');

const web3Eth = new Web3('wss://sepolia.infura.io/ws/v3/faa1104059054173a73d4f9252364e81');
const web3Bsc = new Web3('https://polygon-mumbai-bor.publicnode.com');
const adminPrivKey = '';
const { address: admin } = web3Bsc.eth.accounts.wallet.add(adminPrivKey);

const bridgeEth = new web3Eth.eth.Contract(
  BridgeEth.abi,
  BridgeEth.networks['11155111'].address
);

const bridgeBsc = new web3Bsc.eth.Contract(
  BridgeBsc.abi,
  BridgeBsc.networks['80001'].address
);

console.log(bridgeEth.options.address)

// bridgeEth.getPastEvents(
//   'Transfer',
//   {
//     fromBlock: 	4828095,
//     toBlock: 'latest'
//   },(error,events)=>{
//     console.log(events)
//   }
// )


bridgeEth.events.Transfer(
  {fromBlock: 0}, function(error, event){
    if(!error){
      console.log("haha")
      console.log(event);
    }
    console.log(error)
  }
)
.on('data', async event => {
  const { from, to, amount, date, nonce } = event.returnValues;
  console.log(event)

  const tx = bridgeBsc.methods.mint(to, amount, nonce);
  const [gasPrice, gasCost] = await Promise.all([
    web3Bsc.eth.getGasPrice(),
    tx.estimateGas({from: admin}),
  ]);
  const data = tx.encodeABI();
  const txData = {
    from: admin,
    to: bridgeBsc.options.address,
    data,
    gas: gasCost,
    gasPrice
  };
  const receipt = await web3Bsc.eth.sendTransaction(txData);
  console.log(`Transaction hash: ${receipt.transactionHash}`);
  console.log(`
    Processed transfer:
    - from ${from} 
    - to ${to} 
    - amount ${amount} tokens
    - date ${date}
  `);
});