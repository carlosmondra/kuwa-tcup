pragma solidity ^0.4.24;


import "./KuwaToken.sol";
import "./Owned.sol";

/**
 * The Kuwa Registration contract does this and that...
 */
contract KuwaRegistration is Owned {
    address private clientAddress;
    address public sponsorAddress;

    uint256 private challenge;
    uint256 private challengeCreationTime;

    bytes32 private registrationStatus;

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
        setRegistrationStatusTo("Credentials Provided");
        //sponsorAnte();
    }

    // Generates a 5-digit pseudorandom number
    function rand(address _publicKey) private view returns (uint256){
        // Generates random number
        uint256 lastBlockNumber = block.number - 1;
        uint256 hashVal = uint256(blockhash(lastBlockNumber));
        // This turns the input data into a 100-sided die
        // by dividing by ceil(2 ^ 256 / 10000).
        uint256 FACTOR = 11579208923731619542357098500868790785326998466564056403945758400791312963;
        uint256 randNum = uint256(uint256(keccak256(abi.encodePacked(hashVal, _publicKey))) / FACTOR) + 1;
        // Sometimes the leading value is 0, so because we want the number always to
        // be 4 digits long, we just need to place it at the end of the challenge.
        while (randNum < 1000) {
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
        // timestamp is in seconds, therefore, 36000s == 10hours.
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

    function getRegistrationStatus() public view returns(bytes32) {
        return registrationStatus;
    }

    /** 
     * Possible values for newStatus are:
     * Credentials Provided, Challenge Expired, Video Uploaded, QR Code Scanned, Valid, Invalid
     */
    function setRegistrationStatusTo(bytes32 newStatus) public {
        bool validInputA = newStatus == "Credentials Provided" || newStatus == "Challenge Expired";
        bool validInputB = newStatus == "Video Uploaded" || newStatus == "QR Code Scanned";
        bool validInputC = newStatus == "Valid" || newStatus == "Invalid";
        require(validInputA || validInputB || validInputC); // Validate input
        /* 
         * If `newStatus` is "Valid" or "Invalid", always update
         * If `registrationStatus` is "Valid" or "Invalid" and `newStatus` is not "Valid"
         * or "Invalid", revert the transaction (do not update!) 
         */
        require( (newStatus == "Valid" || newStatus == "Invalid")
                 || !((registrationStatus == "Valid" || registrationStatus == "Invalid")
                 && (newStatus != "Valid" && newStatus != "Invalid")) );
        registrationStatus = newStatus;
    }


    /** ---------------------- Poker Protocol ------------------------- */
    struct Voter {
        bytes32 commit;
        bool voted;
        uint vote;
        bytes32 salt;
        bool valid;
        bool isPaid;
    }

    uint public timeOfFirstVote = 0;
    mapping(address => Voter) public votersMap;
    address[] public votersList;
    // Dummy client address for testing: "0x2140eFD7Ba31169c69dfff6CDC66C542f0211825"
    
    function vote(bytes32 _commit) public returns(bool) {
        require(kt.allowance(sponsorAddress, this) == 1);   // Sponsor must provide ante before voting round for incentive
        //require(timeOfFirstVote == 0 || block.timestamp - timeOfFirstVote <= 3600); // Registrars have one hour to vote after the first vote is cast
        require(kt.balanceOf(msg.sender) >= 100001);   // Qualified registrars must possess at least 100,000 Kuwa tokens 
        require(kt.allowance(msg.sender, this) == 1);   // Registrars must provide the required ante to vote
        require(!votersMap[msg.sender].voted);    // Registrars cannot vote more than once

        if (timeOfFirstVote == 0) {
            timeOfFirstVote = block.timestamp;
        }
        
        if (!kt.transferFrom(msg.sender, this, 1))
            return false;
        votersList.push(msg.sender);
        votersMap[msg.sender] = Voter({commit: _commit, voted: true, vote: 2, salt: 0x0, valid: false, isPaid: false});
        return true;
    }

    function remainingTime() public view returns(uint) {
        return block.timestamp - timeOfFirstVote;
    }

    function reveal(uint _vote, bytes32 _salt) public {
        uint timestamp = block.timestamp;
        //require(timestamp - timeOfFirstVote > 3600 && timestamp - timeOfFirstVote <= 7200);
        require(votersMap[msg.sender].voted);
        require(_vote == 0 || _vote == 1);
        
        votersMap[msg.sender].vote = _vote;
        votersMap[msg.sender].salt = _salt;
        votersMap[msg.sender].valid = keccak256(_vote, _salt) == votersMap[msg.sender].commit ? true : false;
    }
    

    uint public finalStatus = 3;
    uint public dividend = 0;
    function decide() public onlyOwner returns(bool) {
        //require(block.timestamp - timeOfFirstVote > 7200);
        
        if (!kt.transferFrom(msg.sender, this, 1))
            return false;
        uint finalPot = kt.balanceOf(this);
        uint valid = 0;
        uint invalid = 0;
        
        for (uint i = 0; i < votersList.length; i++) {
            Voter storage voter = votersMap[votersList[i]];
            if (voter.valid) {
                if (voter.vote == 1) {
                    valid++;
                }
                else {
                    invalid++;
                }
            }
        }

        if ((invalid + valid) == 0) {
            dividend = finalPot;
        }
        else if (invalid > valid) {
            finalStatus = 0;
            dividend = finalPot / invalid;
            setRegistrationStatusTo("Invalid");
        }
        else if (valid > invalid) {
            finalStatus = 1;
            dividend = finalPot / valid;
            setRegistrationStatusTo("Valid");
        }
        else {
            finalStatus = 2;
            dividend = finalPot / (valid + invalid);
        }

        return true;
    }

    function payout() public onlyOwner returns(bool) {
        require(finalStatus != 3);

        for (uint j = 0; j < votersList.length; j++) {
            Voter storage voter = votersMap[votersList[j]];
            if (!voter.isPaid && voter.valid && (finalStatus == 2 || voter.vote == finalStatus)) {
                if (!kt.transfer(votersList[j], dividend)) {
                    return false;
                }
                voter.isPaid = true;
            }
        }
        return true;
    }
    
    
    /* For debugging and testing*/
    function transferTokens(uint _value) public {
        kt.transfer(address(this), _value);
    }
    
    function transferFromTokens(uint _value) public {
        kt.transferFrom(msg.sender, this, _value);
    }
    
    function balanceOf(address addr) public view returns(uint) {
        return kt.balanceOf(addr);
    }
    
    function dummy(uint _value) public returns(address, address, uint) {
        return (msg.sender, this, _value);
    }
    
    function dummy2() public {
        kt.dummy();
    }

    /*function sponsorAnte() public payable returns(bool) {
        require(msg.sender == sponsorAddress);
    }*/

    /** --------------------------------------------------------------- */
}