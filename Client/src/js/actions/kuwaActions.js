import keythereum from 'keythereum';
import Web3 from 'web3';
import qrcode from 'qrcode';
import { push } from 'connected-react-router'
import { CREATE_KUWA_ID, 
    CREATE_KEYS,
    CREATE_KEYS_SUCCESS,
    REQUEST_SPONSORSHIP, 
    UPLOAD_TO_STORAGE, 
    UNLOCK_KUWA_ID, BACK } from './types';

import config from 'config';

let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(config.web3Provider));

export function createKeys(password) {
    return dispatch => {
        dispatch({
            type: 'CREATE_KEYS_PENDING'
        })
        dispatch({
            type: 'COLLAPSE_AND_HIDE_PASSWORD'
        })
        //defining parameters and options to create an ethereum wallet
        let params = { keyBytes: 32, ivBytes: 16 };
        let dk = keythereum.create(params);
        let options = {
            kdf: "pbkdf2", // or "scrypt" to use the scrypt kdf
            cipher: "aes-128-ctr",
            kdfparams: {
                c: 262144,
                dklen: 32,
                prf: "hmac-sha256"
            }
        };
        try {
            //The key object is generated using a combination of the password and private key. 
            keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, options, keyObject => {
                keythereum.recover(password, keyObject, privateKey => {
                    let privateKeyInHex = privateKey.toString('hex');
                    generateQrCode('0x' + keyObject.address).then(qrCodeSrc => {
                        dispatch({
                            type: 'CREATE_KEYS_FULFILLED',
                            payload: {keyObject, privateKeyInHex, qrCodeSrc}
                        })
                        dispatch(push('/RequestSponsorship'))
                    })
                })
            });
        } catch(e) {
            dispatch({
                type: 'CREATE_KEYS_REJECTED'
            })
            dispatch(push('/Error'))
        }
    }
}

export function requestSponsorship(keyObject, privateKey, sharedSecret) {
    return dispatch => {
        dispatch({
            type: 'REQUEST_SPONSORSHIP_PENDING',
        })
        dispatch({
            type: 'COLLAPSE_AND_HIDE_PASSWORD'
        })
        let formData = new FormData();
        formData.append('address', keyObject.address);
        formData.append('SS', sharedSecret);
        fetch(config.requestUrl.requestSponsorshipUrl, {
            method: 'POST',
            body: formData
        }).then(response => {
            response.json().then(responseJson => {
                if (responseJson.message === 'invalid Shared Secret') {
                    dispatch({
                        type: 'REQUEST_SPONSORSHIP_REJECTED',
                        payload: {error: "Invalid Shared Secret."}
                    })
                    dispatch(push('/Error'))
                } else {
                    loadWallet(privateKey);
                    loadContract(responseJson.abi, responseJson.contractAddress, 4300000, '22000000000', keyObject.address).then(contract => {
                        contract.methods.getChallenge().call().then(challenge => {
                            dispatch({
                                type: 'REQUEST_SPONSORSHIP_FULFILLED',
                                payload: {challenge, responseJson}
                            })
                            dispatch(push('/UploadToStorage'))
                        })
                    })
                }
            })
        }).catch(e => {
            dispatch({
                type: 'REQUEST_SPONSORSHIP_REJECTED',
                payload: {error: "Sorry, we are experiencing internal problems."}
            })
            dispatch(push('/Error'))
        })
    }
}

export function uploadToStorage(videoFilePath, ethereumAddress, abi, contractAddress) {
    return dispatch => {
        dispatch({
            type: 'UPLOAD_TO_STORAGE_PENDING'
        })
        dispatch({
            type: 'COLLAPSE_AND_HIDE_PASSWORD'
        })
        let formData = new FormData();
        new Promise((resolve, reject) => {
            resolveLocalFileSystemURL(videoFilePath, successOnFile, null)
            function successOnFile(fileEntry) {
                fileEntry.file(file => resolve(file));
            }
        }).then(file => {
            let reader = new FileReader();
            reader.readAsArrayBuffer(file);
            new Promise((resolve, reject) => {
                reader.onloadend = (e) => {
                    let videoBlob = new Blob([reader.result], { type:file.type});
                    resolve(videoBlob);
                }
            }).then(videoFile => {
                formData.append('ClientAddress',ethereumAddress);
                formData.append('ChallengeVideo',videoFile);
                formData.append('ContractABI',JSON.stringify(abi));
                formData.append('ContractAddress',contractAddress);
                fetch(config.requestUrl.uploadInformationUrl, {
                    method: 'POST',
                    body: formData
                }).then(response => {
                    dispatch({
                        type: 'UPLOAD_TO_STORAGE_FULFILLED',
                        payload: {response}
                    })
                    dispatch(push('/Success'))
                }).catch(e => {
                    dispatch({
                        type: 'UPLOAD_TO_STORAGE_REJECTED',
                        payload: {error: "Seems like the Information was not uploaded"}
                    })
                    dispatch(push('/Error'))
                })
            })
        })
    }
}

export function webUploadToStorage(videoBlob, ethereumAddress, abi, contractAddress) {
    return dispatch => {
        dispatch({
            type: 'WEB_UPLOAD_TO_STORAGE_PENDING'
        })
        dispatch({
            type: 'COLLAPSE_AND_HIDE_PASSWORD'
        })
        let formData = new FormData();
        formData.append('ClientAddress',ethereumAddress);
        formData.append('ChallengeVideo',videoBlob);
        formData.append('ContractABI',JSON.stringify(abi));
        formData.append('ContractAddress',contractAddress);
        fetch(config.requestUrl.uploadInformationUrl, {
            method: 'POST',
            body: formData
        }).then(response => {
            dispatch({
                type: 'WEB_UPLOAD_TO_STORAGE_FULFILLED',
                payload: {response}
            })
            dispatch(push('/Success'))
        }).catch(e => {
            dispatch({
                type: 'WEB_UPLOAD_TO_STORAGE_REJECTED',
                payload: {error: "Seems like the Information was not uploaded"}
            })
            dispatch(push('/Error'))
        })
    }
}

function generateQrCode(ethereumAddress) {
    let opts = {
        errorCorrectionLevel: 'H',
        type: 'image/jpeg',
        rendererOpts: {
            quality: 0.3
        }
    }

    return new Promise((resolve, reject) => {
        qrcode.toDataURL(ethereumAddress, opts, function (err, url) {
            if (err) throw reject(err);
            resolve(url);
        })
    })
}

/**
 * Creates a wallet with the provided private key
 * @param  {string} privateKey 
 * @return {void}
 */
const loadWallet = function(privateKey) {
    web3.eth.accounts.wallet.clear();
    web3.eth.accounts.wallet.add(privateKey);
}

/**
 * Loads a smart contract
 * @param  {JSON} abi 
 * @param  {string} contractAddress 
 * @param  {number} gas 
 * @param  {string} gasPrice 
 * @param  {string} from 
 * @return 
 */
const loadContract = async function(abi, contractAddress, gas, gasPrice, from) {
    let contract = new web3.eth.Contract(abi);
    contract.options.address = contractAddress;
    contract.options.from = from;
    contract.options.gasPrice = gasPrice;
    contract.options.gas = gas;
    return contract;
}