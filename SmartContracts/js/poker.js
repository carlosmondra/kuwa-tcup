var Web3 = require('web3');
var solc = require('solc');
var fs = require("fs");
var keythereum = require('keythereum');
var util = require('util');
var md5 = require('md5');

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider("https://rinkeby.infura.io/8Dx9RdhjqIl1y3EQzQpl"));

// This function compiles the solidity file. Similar to truffle compile, but it is done here.
var compileSolFile = async function(solFilePath, contractName) {
    var output;
    try {
        let readFile = util.promisify(fs.readFile);
        let solidityCode = await readFile(solFilePath, "utf8");
        let input = solidityCode.toString();
        output = solc.compile(input, 1);
    }
    catch (err) {
        console.log(err);
    }

    console.log(output);
    let compilation = {}
    if (output) {
        compilation.bc = output.contracts[':' + contractName].bytecode;
        compilation.abi = JSON.parse(output.contracts[':' + contractName].interface);
    }

    return compilation;
}

var loadWallet = async function(walletPath, accountAddress, password) {
    let keyObject = keythereum.importFromFile(accountAddress.substring(2), walletPath);
    let privateKey = keythereum.recover(password, keyObject);
    privateKey = "0x" + privateKey.toString("hex");
    web3.eth.accounts.wallet.add(privateKey);
}

var deployContract = async function(abi, bc, gas, gasPrice, from, constructorArgs) {
    if (gas <= 0) {
        console.log("deployContract(): must provide a gas value greater than 0");
        return undefined;
    }

    var contractInstance;
    try {
        let contract = new web3.eth.Contract(abi);
        contractInstance = await contract.deploy({
            data: '0x' + bc,
            arguments: constructorArgs
        }).send({
            from: from,
            gas: gas,
            gasPrice: gasPrice
        });
    } catch (err) {
        console.log(err);
    }

    if (contractInstance) {
        contractInstance.options.from = from;
        contractInstance.options.gasPrice = gasPrice;
        contractInstance.options.gas = gas;
        console.log("Contract Address: " + contractInstance.options.address);
    }

    return contractInstance;
}

var loadContract = async function(abi, contractAddress, gas, gasPrice, from) {
    let contract = new web3.eth.Contract(abi);
    contract.options.address = contractAddress;
    contract.options.from = from;
    contract.options.gasPrice = gasPrice;
    contract.options.gas = gas;
    return contract;
}


var run = async function() {
    
    web3.eth.accounts.wallet.clear();

    // // Alice: (1, "0x1")
    // let aliceCommit = "0x633c048f70a5b29b15342939cffc35d88af48ce91d93b340c6bd1dfbae54faa7";
    // // Bob: (1, "0x2")
    // let bobCommit = "0x75aea9dd444ae0a80175efff3f1cffb4c72f7249c7a3e2c295133d41cf2dcdf5";
    // // Carlos: (0, "0x3")
    // let carlosCommit = "0x66607c6af1e9511fb2a66ace9345f9e56fcca50dfaeae155ae2712fb85f2412a";

    // Alice: keccak256(1, "0xfff23243")
    let aliceCommit = "0x37e9ace32975b54d672f5f5535943ad91657e8745e0a740f13ba638157f3b329";
    // Bob: keccak256(1, "0xfff23244")
    let bobCommit = "0x5ba0e331251da5367c55afa3e15936307c2ff51552fed2d4678b1704f9bf46cf";
    // Carlos: keccak256(0, "0xfff23245")
    let carlosCommit = "0x7563dc86731c4d9242ca545a11171d0b710f9bf924444444ab015ff10d93603d";


    wallets = JSON.parse(fs.readFileSync('wallets.json')); 
    let kuwaWallet = await loadWallet(wallets.keystore_dir, wallets.kuwa_foundation, wallets.password);
    let sponsorWallet = await loadWallet(wallets.keystore_dir, wallets.sponsor, wallets.password);
    let aliceWallet = await loadWallet(wallets.keystore_dir, wallets.alice, wallets.password);
    let bobWallet = await loadWallet(wallets.keystore_dir, wallets.bob, wallets.password);
    let carlosWallet = await loadWallet(wallets.keystore_dir, wallets.carlos, wallets.password);
    
    console.log("Loaded all wallets");

    newCompilations = {};
    var kuwaTokenInput = {
        'ERC20Interface.sol': fs.readFileSync('../contracts/ERC20Interface.sol', 'utf8'),
        'SafeMath.sol': fs.readFileSync('../contracts/SafeMath.sol', 'utf8'),
        'Owned.sol': fs.readFileSync('../contracts/Owned.sol', 'utf8'),
        'KuwaToken.sol': fs.readFileSync('../contracts/KuwaToken.sol', 'utf8')
    };
    let compiledContract = solc.compile({sources: kuwaTokenInput}, 1);
    newCompilations['KuwaToken'] = {};
    newCompilations['KuwaToken'].abi = JSON.parse(compiledContract.contracts['KuwaToken.sol:KuwaToken'].interface);
    newCompilations['KuwaToken'].bytecode = /*'0x+'*/compiledContract.contracts['KuwaToken.sol:KuwaToken'].bytecode;

    var kuwaRegistrationInput = {
        'ERC20Interface.sol': fs.readFileSync('../contracts/ERC20Interface.sol', 'utf8'),
        'SafeMath.sol': fs.readFileSync('../contracts/SafeMath.sol', 'utf8'),
        'Owned.sol': fs.readFileSync('../contracts/Owned.sol', 'utf8'),
        'KuwaToken.sol': fs.readFileSync('../contracts/KuwaToken.sol', 'utf8'),
        'KuwaRegistration.sol': fs.readFileSync('../contracts/KuwaRegistration.sol', 'utf8')
    };
    compiledContract = solc.compile({sources: kuwaRegistrationInput}, 1);
    newCompilations['KuwaRegistration'] = {};
    newCompilations['KuwaRegistration'].abi = JSON.parse(compiledContract.contracts['KuwaRegistration.sol:KuwaRegistration'].interface);
    newCompilations['KuwaRegistration'].bytecode = compiledContract.contracts['KuwaRegistration.sol:KuwaRegistration'].bytecode;

    var qualifiedKuwaRegistrarInput = {
        'ERC20Interface.sol': fs.readFileSync('../contracts/ERC20Interface.sol', 'utf8'),
        'SafeMath.sol': fs.readFileSync('../contracts/SafeMath.sol', 'utf8'),
        'Owned.sol': fs.readFileSync('../contracts/Owned.sol', 'utf8'),
        'KuwaToken.sol': fs.readFileSync('../contracts/KuwaToken.sol', 'utf8'),
        'KuwaRegistration.sol': fs.readFileSync('../contracts/KuwaRegistration.sol', 'utf8'),
        'QualifiedKuwaRegistrar.sol': fs.readFileSync('../contracts/QualifiedKuwaRegistrar.sol', 'utf8')
    };
    compiledContract = solc.compile({sources: qualifiedKuwaRegistrarInput}, 1);
    newCompilations['QualifiedKuwaRegistrar'] = {};
    newCompilations['QualifiedKuwaRegistrar'].abi = JSON.parse(compiledContract.contracts['QualifiedKuwaRegistrar.sol:QualifiedKuwaRegistrar'].interface);
    newCompilations['QualifiedKuwaRegistrar'].bytecode = compiledContract.contracts['QualifiedKuwaRegistrar.sol:QualifiedKuwaRegistrar'].bytecode;

    console.log("Compiled all contracts");

    let gas = 4300000;
    let gasPrice = '40000000000'; //await web3.eth.getGasPrice();
    let kuwaToken;
    kuwaToken = await deployContract(newCompilations['KuwaToken'].abi, newCompilations['KuwaToken'].bytecode,
                                     gas, gasPrice, wallets.kuwa_foundation, []);
    console.log("Deployed Kuwa Token contract");

    let kuwaRegistration;
    kuwaRegistration = await deployContract(newCompilations['KuwaRegistration'].abi, newCompilations['KuwaRegistration'].bytecode,
                                                gas, gasPrice, wallets.sponsor, [wallets.client, kuwaToken.options.address]);
    newCompilations['KuwaRegistration'].address = kuwaRegistration.options.address;
    console.log("Deployed Kuwa Registration contract");

    let aliceQKR, bobQKR, carlosQKR;
    aliceQKR = await deployContract(newCompilations['QualifiedKuwaRegistrar'].abi, newCompilations['QualifiedKuwaRegistrar'].bytecode,
                                        gas, gasPrice, wallets.alice, [kuwaToken.options.address]);
    bobQKR = await deployContract(newCompilations['QualifiedKuwaRegistrar'].abi, newCompilations['QualifiedKuwaRegistrar'].bytecode,
                                    gas, gasPrice, wallets.bob, [kuwaToken.options.address]);
    carlosQKR = await deployContract(newCompilations['QualifiedKuwaRegistrar'].abi, newCompilations['QualifiedKuwaRegistrar'].bytecode,
                                        gas, gasPrice, wallets.carlos, [kuwaToken.options.address]);
    newCompilations['QualifiedKuwaRegistrar'].alice_address = aliceQKR.options.address;
    newCompilations['QualifiedKuwaRegistrar'].bob_address = bobQKR.options.address;
    newCompilations['QualifiedKuwaRegistrar'].carlos_address = carlosQKR.options.address;
    
    console.log("Deployed all Qualified Kuwa Registrar contracts");

    console.log("--------------------------------------------------------------------------------------------"); 
    console.log("Initial transfer of Kuwa tokens to Sponsor and Registrar's QKR contracts");
    await kuwaToken.methods.transfer(wallets.sponsor, 200010).send({from: wallets.kuwa_foundation});
    await kuwaToken.methods.transfer(aliceQKR.options.address, 100010).send({from: wallets.kuwa_foundation});
    await kuwaToken.methods.transfer(bobQKR.options.address, 100010).send({from: wallets.kuwa_foundation});
    await kuwaToken.methods.transfer(carlosQKR.options.address, 100010).send({from: wallets.kuwa_foundation});

    console.log("Token balances for each participant of the protocol:");
    console.log(`Kuwa Foundation: ${await kuwaToken.methods.balanceOf(wallets.kuwa_foundation).call({from: wallets.kuwa_foundation})}`);
    console.log(`Sponsor: ${await kuwaToken.methods.balanceOf(wallets.sponsor).call({from: wallets.sponsor})}`);
    console.log(`Alice QKR: ${await kuwaToken.methods.balanceOf(aliceQKR.options.address).call({from: wallets.alice})}`);
    console.log(`Bob QKR: ${await kuwaToken.methods.balanceOf(bobQKR.options.address).call({from: wallets.bob})}`);
    console.log(`Carlos QKR: ${await kuwaToken.methods.balanceOf(carlosQKR.options.address).call({from: wallets.carlos})}`);
    
    console.log("--------------------------------------------------------------------------------------------");
    console.log("Begin Poker protocol...");

    console.log("Sponsor providing required ante for incentive...");
    await kuwaToken.methods.approve(kuwaRegistration.options.address, 1).send({ from: wallets.sponsor })
    console.log("*********************************************************************************************");
    
    console.log("Begin voting process...");
    await aliceQKR.methods.vote(kuwaRegistration.options.address, aliceCommit, 1).send({from: wallets.alice})
    console.log("Alice has voted through its QKR contract (%s) with a committed hash of: %s", aliceQKR.options.address, aliceCommit)
    await bobQKR.methods.vote(kuwaRegistration.options.address, bobCommit, 1).send({from: wallets.bob})
    console.log("Bob has voted through its QKR contract (%s) with a committed hash of: %s", bobQKR.options.address, bobCommit)
    await carlosQKR.methods.vote(kuwaRegistration.options.address, carlosCommit, 1).send({from: wallets.carlos})
    console.log("Carlos has voted through its QKR contract (%s) with a committed hash of: %s", carlosQKR.options.address, carlosCommit)
    console.log("*********************************************************************************************");

    console.log("Get token balance for the Kuwa Registration contract...");
    console.log(await kuwaToken.methods.balanceOf(kuwaRegistration.options.address).call())
    console.log("*********************************************************************************************");

    console.log("Display voters' addresses...");
    console.log(await kuwaRegistration.methods.getVotersList().call())
    console.log("*********************************************************************************************");

    console.log("Registrars reveal their votes...");
    await aliceQKR.methods.reveal(kuwaRegistration.options.address, 1, "0xfff23243").send({from: wallets.alice})
    console.log("Alice has revealed.")
    console.log("Honest? %s", await aliceQKR.methods.isVoterHonest(kuwaRegistration.options.address).call())

    await bobQKR.methods.reveal(kuwaRegistration.options.address, 1, "0xfff23244").send({from: wallets.bob})
    console.log("Bob has revealed.")
    console.log("Honest? %s", await bobQKR.methods.isVoterHonest(kuwaRegistration.options.address).call())

    await carlosQKR.methods.reveal(kuwaRegistration.options.address, 0, "0xfff23245").send({from: wallets.carlos})
    console.log("Carlos has revealed.")
    console.log("Honest? %s", await carlosQKR.methods.isVoterHonest(kuwaRegistration.options.address).call())
    console.log("*********************************************************************************************");

    console.log("Sponsor decides the winner and the final status of the Kuwa client...")
    await kuwaRegistration.methods.decide().send({from: wallets.sponsor});
    console.log("The final status (0=Invalid, 1=Valid, 2=Tie): %d", await kuwaRegistration.methods.getFinalStatus().call());
    console.log("The dividend that each winner will receive as reward: %d", await kuwaRegistration.methods.getDividend().call());
    console.log("*********************************************************************************************");

    console.log("Winning registrars collect their dividend...Losing registrars will get a txn revert!")
    console.log("Alice claims her reward.")
    await aliceQKR.methods.payout(kuwaRegistration.options.address).send({from: wallets.alice});
    console.log("Alice's QKR contract token balance: %d", await kuwaToken.methods.balanceOf(aliceQKR.options.address).call());
    console.log("Bob claims his reward.")
    await bobQKR.methods.payout(kuwaRegistration.options.address).send({from: wallets.bob});
    console.log("Bob's QKR contract token balance: %d", await kuwaToken.methods.balanceOf(bobQKR.options.address).call());
    //await carlosQKR.methods.payout(kuwaRegistration.options.address).send({from: wallets.alice});
    console.log("Carlos cannot claim his reward!")
    console.log("Carlos's QKR contract token blaance: %d", await kuwaToken.methods.balanceOf(carlosQKR.options.address).call());
}

run().catch(err => console.log(err));