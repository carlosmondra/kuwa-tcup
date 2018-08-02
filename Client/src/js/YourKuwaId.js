import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Loading } from './Load';

import { startScanner, stopScanner, qrCodeFound, mobileStartScanner } from './actions/qrActions';
import Instascan from 'instascan';

import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

import Button from '@material-ui/core/Button';
const buttonColor = "#11B73F";

import { paperHeader } from './paperHeader';

const styles = theme => ({
    root: Object.assign({}, theme.mixins.gutters(), {
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2,
    })
});

class YourKuwaId extends Component {
    constructor(props) {
        super(props);
        this.state = {
            videoWidth: 0,
            videoHeight: 0,
            scanner: {}
        }
    }

    render() {
        if (this.props.qrStatus === "Scanning" && window.usingCordova) {
            return (
                <QRSquare />
            )
        }
        return (
            <Grid container justify="center" style={{flexGrow: 1}}>
                { renderYourKuwaId(this.props, this.state, this.setState.bind(this)) }
            </Grid>
        );
    }
}

class QRSquare extends Component {
    componentWillMount() {
        let orientation = window.screen.orientation.type;
        if (orientation.includes("portrait")) {
            window.screen.orientation.lock("portrait");
        } else if (orientation.includes("landscape")) {
            window.screen.orientation.lock("landscape");
        }
        let bottomNav = document.getElementById("bottomNav");
        let navigation = document.getElementById("mobileNavbar");

        this.canvasWidth = window.innerWidth;
        this.canvasHeight = window.innerHeight - navigation.offsetHeight - bottomNav.offsetHeight;
    }
    componentDidMount() {
        let canvas = document.getElementById("square");
        let ctx = canvas.getContext("2d");

        let side = canvas.height * 0.6
        if (canvas.width < canvas.height) {
            side = canvas.width * 0.6;
        }

        let x = canvas.width / 2 - side / 2;
        let y = canvas.height / 2 - side / 2;

        ctx.beginPath();
        ctx.lineWidth="4";
        ctx.strokeStyle="#11B73F";
        ctx.rect(x,y,side,side);
        ctx.stroke();
    }

    componentWillUnmount() {
        window.screen.orientation.unlock();
    }

    render() {
        return (
            <canvas id="square" width={ this.canvasWidth } height={ this.canvasHeight }></canvas>
        );
    }
}

const renderYourKuwaId = (props, state, setState) => (
    <Grid item xs={12} sm={10} md={8} lg={6} xl={6}>
        <Paper className={props.classes.root} elevation={1} style={{margin: 20}}>

            { paperHeader("Your Kuwa ID") }

            <Typography variant="title" align="center" style={{margin: "1em"}}>
                <strong>Kuwa ID:</strong>
            </Typography>
            <Typography variant="title" align="center" style={{wordWrap: "break-word", margin: "1em"}}>
                { props.kuwaId ? props.kuwaId : "You first need to create your Kuwa Identity" }
            </Typography>
            <Typography variant="subheading" align="left" style={{margin: "1em"}}>
                The following QR code image represents your Kuwa ID:
            </Typography>
            <Grid align="center">
                <img src={ props.qrCodeSrc } alt="Here will lie a QR code" />
            </Grid>

            {
                props.registrationStatus === "Video Uploaded" ?
                <Typography variant="subheading" align="left" style={{margin: "1em"}}>
                    <strong>Step 3 –</strong> Please ask other people that you know to scan your QR code.
                </Typography>
                : null
            }

            { 
                props.qrStatus === "Found" ? null : 
                <Grid container spacing={24} justify="center">
                    <Grid item xs={6} align="center">
                        <Button variant="contained" style={{backgroundColor: buttonColor}} onClick={() => handleScanAction(props, state, setState)}>
                            { props.qrStatus === "Scanning" ? "Stop scan" : "Scan an ID"}
                        </Button>
                    </Grid>
                    <Grid item xs={6} align="center">
                        <Button variant="contained" style={{backgroundColor: buttonColor}} onClick={() => alert("JAJAJAJAJAJA")}>
                            Export your ID
                        </Button>
                    </Grid>
                </Grid>
            }

            <Grid container justify="center" style={{margin: "1em"}}>
                <Grid item xs={12} align="center">
                    <video id="qrScanner" style={{ width: state.videoWidth, height: state.videoHeight }} />
                </Grid>
            </Grid>

            { props.qrStatus === "Found" ? <Loading loadingMessage="We are adding the scanned ID to your network" /> : null }

            <Typography variant="title" align="center" style={{margin: "1em"}}>
                { scannedKuwaId(props) }
            </Typography>

        </Paper>
    </Grid>
)

const scannedKuwaId = (props) => {
    switch(props.qrStatus) {
        case "Uploaded":
            return props.lastScannedKuwaId + " is now part of your network.";
        case "Invalid":
            return "The scanned QR code is not a Kuwa ID.";
        default:
            return null;
    }
}

const handleScanAction = (props, state, setState) => {
    if(window.usingCordova) {
        props.mobileStartScanner(props.contractAddress, props.abi);
    } else {
        if (props.qrStatus === "Scanning") {
            props.stopScanner(state.scanner);
            setState({ 
                videoWidth: 0,
                videoHeight: 0 })
        } else {
            setState({ 
                videoWidth: "90%",
                videoHeight: "auto" })
            
                let scanner = new Instascan.Scanner({ video: document.getElementById('qrScanner') });
                setState({ scanner });
                scanner.addListener('scan', function(kuwaId) {
                    props.qrCodeFound(kuwaId, scanner, props.contractAddress, props.abi);
                    setState({ 
                        videoWidth: 0,
                        videoHeight: 0 })
                });
                props.startScanner(scanner);
        }
    }


    
}

const mapStateToProps = state => {
    return {
        qrCodeSrc: state.kuwaReducer.kuwaId.qrCodeSrc,
        kuwaId: state.kuwaReducer.kuwaId.address,
        scanner: state.qrReducer.scanner,
        qrStatus: state.qrReducer.qrStatus,
        lastScannedKuwaId: state.qrReducer.lastScannedKuwaId,

        registrationStatus: state.kuwaReducer.kuwaId.registrationStatus,

        abi: state.kuwaReducer.kuwaId.abi,
        contractAddress: state.kuwaReducer.kuwaId.contractAddress,
    }
}

const mapDispatchToProps = dispatch => {
    return {
        startScanner: scanner => {
            dispatch(startScanner(scanner))
        },
        stopScanner: scanner => {
            dispatch(stopScanner(scanner))
        },
        qrCodeFound: (kuwaId, scanner, contractAddress, abi) => {
            dispatch(qrCodeFound(kuwaId, scanner, contractAddress, abi))
        },
        mobileStartScanner: (contractAddress, abi) => {
            dispatch(mobileStartScanner(contractAddress, abi))
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(YourKuwaId));