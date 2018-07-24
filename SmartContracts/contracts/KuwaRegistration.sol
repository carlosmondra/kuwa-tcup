pragma solidity ^0.4.2;

/**
 * The KuwaToken contract does this and that...
 */
contract KuwaRegistration {
    address private clientAddress;
    address private sponsorAddress;

    uint256 private challenge;
    uint256 private challengeCreationTime;

    enum RegistrationStatus { ChallengeGenerated, ChallengeExpired, WaitingForValidation, Valid, Invalid }
    bytes20 private registrationStatus;

	//constructor
	//set the total number of tokens
	//read total number of tokens
    constructor (address _clientAddress) public{
        clientAddress = _clientAddress;
        sponsorAddress = msg.sender;
        generateChallenge();
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

    function getRegistrationStatus() public view returns(bytes20) {
        return registrationStatus;
    }

    function markAsValid() public {
        registrationStatus = "Valid";
    }

    function markAsInvalid() public {
        registrationStatus = "Invalid";
    }

    // Possible values for newStatus are:
    // Challenge Expired, Video Uploaded, QR code scanned
    function setRegistrationStatusTo(bytes20 newStatus) public {
        registrationStatus = newStatus;
    }

    /* Kills this contract and refunds the balance to the Sponsor */
    function killContract() public {
        require(msg.sender == sponsorAddress);
        selfdestruct(sponsorAddress);
    }
}

