pragma solidity ^0.4.24;


import "./KuwaToken.sol";

/**
 * The Kuwa Registration contract does this and that...
 */
contract KuwaRegistration {
    address private clientAddress;
    address private sponsorAddress;

    uint256 private challenge;
    uint256 private challengeCreationTime;

    bytes20 private registrationStatus;

    address[] private kuwaNetwork;

    // For Poker Protocol 
    // ---------------------
    KuwaToken kt;
    address kuwaTokenContract;
    //----------------------

	//constructor
	//set the total number of tokens
	//read total number of tokens
    constructor (address _clientAddress, address _kuwaTokenContract) public payable {
        clientAddress = _clientAddress;
        sponsorAddress = msg.sender;
        kuwaTokenContract = _kuwaTokenContract;
        kt = KuwaToken(_kuwaTokenContract);
        generateChallenge();
        //sponsorAnte();
    }

    // Generates a 5-digit pseudorandom number
    function rand(address _publicKey) private view returns (uint256){
        // Generates random number
        uint256 lastBlockNumber = block.number - 1;
        uint256 hashVal = uint256(blockhash(lastBlockNumber));
        // This turns the input data into a 100-sided die
        // by dividing by ceil(2 ^ 256 / 100000).
        uint256 FACTOR = 1157920892373161954235709850086879078532699846656405640394575840079131296;
        uint256 randNum = uint256(uint256(keccak256(abi.encodePacked(hashVal, _publicKey))) / FACTOR) + 1;
        // Sometimes the leading value is 0, so because we want the number always to
        // be 5 digits long, we just need to place it at the end of the challenge.
        while (randNum < 10000) {
            randNum = randNum * 10;
        }
        return randNum;
    }
	
    // Generates a challenge using the rand method and stores it in challenges
    function generateChallenge() private {
        challenge = rand(clientAddress);
        challengeCreationTime = block.timestamp;
        registrationStatus = "Challenge Generated";
    }

    // This was not part of the specification of the week but it makes sense to add it
    function getChallenge() public view returns(uint256) {
        uint256 timeElapsed = block.timestamp - challengeCreationTime;
        // timestamp is in seconds, therefore, 36000s == 10min.
        // We may need to change this later.
        if (timeElapsed < 36000) {
            return challenge;
        }
        return 0;
    }

    function addScannedKuwaId(address kuwaId) public {
        kuwaNetwork.push(kuwaId);
    }

    function getKuwaNetwork() public view returns(address[]) {
        return kuwaNetwork;
    }

    function getRegistrationStatus() public view returns(bytes20) {
        return registrationStatus;
    }

    // Possible values for newStatus are:
    // Challenge Expired, Video Uploaded, QR code scanned, Valid, Invalid
    function setRegistrationStatusTo(bytes20 newStatus) public {
        registrationStatus = newStatus;
    }

    /* Kills this contract and refunds the balance to the Sponsor */
    function killContract() public {
        require(msg.sender == sponsorAddress);
        selfdestruct(sponsorAddress);
    }

    /** ---------------------- Poker Protocol ------------------------- */
    uint invalid = 0;
    uint valid = 0;
    uint timeOfFirstVote = 0;
    mapping(address => bytes32) map;
    address[] public voters;

    function vote(string status) public returns(bool){
        require(kt.allowance(sponsorAddress, this) == 1);
        require(timeOfFirstVote == 0 || block.timestamp - timeOfFirstVote <= 3600);
        require(kt.balanceOf(msg.sender) >= 100001);
        require(kt.allowance(msg.sender, this) == 1);
        bytes32 statusDigest = keccak256(_toLower(status));
        require(statusDigest == keccak256("valid") || statusDigest == keccak256("invalid"));
        require(map[msg.sender] == 0x0);

        if (valid + invalid < 1) {
            timeOfFirstVote = block.timestamp;
        }
        
        kt.transferFrom(msg.sender, this, 1);
        if (statusDigest == keccak256("valid")) {
            valid += 1;
        }
        else {
            invalid += 1;
        }
        voters.push(msg.sender);
        map[msg.sender] = statusDigest;
        return true;
    }

    function payout() public returns(bool) {
        require(block.timestamp - timeOfFirstVote > 3600);
        
        bytes32 majorityStatus;
        uint finalPot = kt.balanceOf(this);
        uint dividend;
        if (valid > invalid) {
            majorityStatus = keccak256("valid");
            dividend = finalPot / valid;
        }
        else if (invalid > valid) {
            majorityStatus = keccak256("invalid");
            dividend = finalPot / invalid;
        }
        else {
            majorityStatus = 0x0;
            dividend = finalPot / (valid + invalid);
        }

        for (uint i = 0; i < voters.length; i++) {
            if (majorityStatus == 0x0) {
                kt.transfer(voters[i], dividend);
            }
            else {
                if (map[voters[i]] == majorityStatus) {
                    kt.transfer(voters[i], dividend);
                }
            }
        }
        return true;
    }

    /*function sponsorAnte() public payable returns(bool) {
        require(msg.sender == sponsorAddress);
        
    }*/

    /* Author: Thomas MacLean */
    function _toLower(string str) public pure returns(string) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            // Uppercase character...
            if ((bStr[i] >= 65) && (bStr[i] <= 90)) {
                // So we add 32 to make it lowercase
                bLower[i] = bytes1(int(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }

    /** --------------------------------------------------------------- */
}



