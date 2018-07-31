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

    wallets = JSON.parse(fs.readFileSync('wallets.json')); 
    let kuwaWallet = await loadWallet(wallets.keystore_dir, wallets.kuwa_foundation, wallets.password);
    let sponsorWallet = await loadWallet(wallets.keystore_dir, wallets.sponsor, wallets.password);
    let aliceWallet = await loadWallet(wallets.keystore_dir, wallets.alice, wallets.password);
    let bobWallet = await loadWallet(wallets.keystore_dir, wallets.bob, wallets.password);
    let carlosWallet = await loadWallet(wallets.keystore_dir, wallets.carlos, wallets.password);
    

    oldCompilations = JSON.parse(fs.readFileSync('compilations.json'));
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

    let kuwaToken;
    kuwaToken = await deployContract(newCompilations['KuwaToken'].abi, newCompilations['KuwaToken'].bytecode,
                                     5000000, '22000000000', wallets.kuwa_foundation, []);
    console.log("Deployed Kuwa Token contract");

    let kuwaRegistration;
    if (md5(newCompilations['KuwaRegistration'].abi) !== md5(oldCompilations['KuwaRegistration'].abi)) {
        kuwaRegistration = await deployContract(newCompilations['KuwaRegistration'].abi, newCompilations['KuwaRegistration'].bytecode,
                                                5000000, '22000000000', wallets.kuwa_foundation, [wallets.client, kuwaToken.options.address]);
        newCompilations['KuwaRegistration'].address = kuwaRegistration.options.address;
    }
    else {
        kuwaRegistration = await loadContract(oldCompilations['KuwaRegistration'].abi, oldCompilations['KuwaRegistration']['address'],
                                              5000000, "22000000000", wallets.kuwa_foundation);
    }
    console.log("Deployed Kuwa Registration contract");

    let aliceQKR, bobQKR, carlosQKR;
    if (md5(newCompilations['QualifiedKuwaRegistrar'].abi) !== md5(oldCompilations['QualifiedKuwaRegistrar'].abi)) {
        aliceQKR = await deployContract(newCompilations['QualifiedKuwaRegistrar'].abi, newCompilations['QualifiedKuwaRegistrar'].bytecode,
                                        5000000, '22000000000', wallets.kuwa_foundation, [kuwaToken.options.address]);
        bobQKR = await deployContract(newCompilations['QualifiedKuwaRegistrar'].abi, newCompilations['QualifiedKuwaRegistrar'].bytecode,
                                      5000000, '22000000000', wallets.kuwa_foundation, [kuwaToken.options.address]);
        carlosQKR = await deployContract(newCompilations['QualifiedKuwaRegistrar'].abi, newCompilations['QualifiedKuwaRegistrar'].bytecode,
                                         5000000, '22000000000', wallets.kuwa_foundation, [kuwaToken.options.address]);
    }
    else {
        aliceQKR = await loadContract(oldCompilations['QualifiedKuwaRegistrar'].abi, oldCompilations['QualifiedKuwaRegistrar'].alice_address,
                                      5000000, "22000000000", wallets.kuwa_foundation);
        bobQKR = await loadContract(oldCompilations['QualifiedKuwaRegistrar'].abi, oldCompilations['QualifiedKuwaRegistrar'].bob_address,
                                    5000000, "22000000000", wallets.kuwa_foundation);
        carlosQKR = await loadContract(oldCompilations['QualifiedKuwaRegistrar'].abi, oldCompilations['QualifiedKuwaRegistrar'].carlos_address,
                                       5000000, "22000000000", wallets.kuwa_foundation);
    }
    newCompilations['QualifiedKuwaRegistrar'].alice_address = aliceQKR.options.address;
    newCompilations['QualifiedKuwaRegistrar'].bob_address = bobQKR.options.address;
    newCompilations['QualifiedKuwaRegistrar'].carlos_address = carlosQKR.options.address;
    
    console.log("Deployed all Qualified Kuwa Registrar contracts");

    fs.writeFile("compilations.json", JSON.stringify(newCompilations), function(err) {
        if(err) {
            return console.log(err);
        }
    }); 
    
    /*
    // let contractInstance = await loadContract(compilation.abi, "0x30768510F1A57B12817CDC2a723C8AE21de071b5", 4300000, "22000000000", "0xF9F83AaA322aB613Db21229BE6ca9E2dF8a1A149");
    await contractInstance.methods.generateChallenge().send();
    let challenge = await contractInstance.methods.getChallenge().call();
    console.log(challenge);
    */
}

run().catch(err => console.log(err));