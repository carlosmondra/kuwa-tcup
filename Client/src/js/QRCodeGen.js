import { Button, Container, Row, Col, Table } from 'reactstrap';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Instascan from 'instascan';

import { startScanner, qrCodeFound, mobileStartScanner } from './actions/qrActions';

let scanner;

class QRCode extends Component {
    componentDidMount() {
        if(!this.props.isMobile) {
            scanner = new Instascan.Scanner({ video: document.getElementById('qrScanner') });
            scanner.addListener('scan', (function(kuwaId) {
                this.props.qrCodeFound(kuwaId, scanner);
            }).bind(this));
        }
    }
    render() {
        return (
            <Container>
                {showQRCode(this.props)}
                {scanQRCode(this.props, this)}
                {showNetwork(this.props)}
            </Container>
        )
    }
}

const showQRCode = (props) => {
    if (props.qrCodeSrc) {
        return (
            <div>
                <Row className="row-kuwa-reg">
                    <Col>
                        <h2>
                            <span className="header-kuwa-reg">This is your Kuwa Identity</span>
                        </h2>
                    </Col>
                </Row>
                <Row className="row-kuwa-reg">
                    <Col>
                        <img className="responsive-kuwa-img" src={props.qrCodeSrc} alt="QRCode"/>
                    </Col>
                </Row>
            </div>
        );
    }
    return (
        <Row className="row-kuwa-reg">
            <Col>
                <h2>
                    <span className="header-kuwa-reg">You first need to create your Kuwa Identity</span>
                </h2>
            </Col>
        </Row>
    );
}

const scanQRCode = (props, component) => {
    if(props.isMobile) {
        return (
            <Row className="row-kuwa-reg">
                <Col>
                    <Button color="primary" onClick={() => props.mobileStartScanner(component)}>Start Scan</Button>
                </Col>
            </Row>
        )
    } else {
        return (
            <div>
                <Row className="row-kuwa-reg">
                    <Col>
                        <Button color="primary" onClick={() => props.startScanner(scanner)}>Start Scan</Button>
                    </Col>
                </Row>
                <Row className="row-kuwa-reg">
                    <Col>
                        <video id="qrScanner" />
                    </Col>
                </Row>
            </div>
        );
    }
}

const showNetwork = (props) => {
    return (
        <Row className="row-kuwa-reg">
            <Col>
                <Table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Kuwa ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.kuwaNetwork.map((kuwaId, index) => {
                            return (
                                <tr key={(index + 1).toString()}>
                                    <th scope="row">{index + 1}</th>
                                    <td>{kuwaId}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </Table>
            </Col>
        </Row>
    )
}

const mapStateToProps = state => {
    return {
        qrCodeSrc: state.kuwaReducer.kuwaId.qrCodeSrc,
        isMobile: state.kuwaReducer.isMobile,
        scanner: state.qrReducer.scanner,
        kuwaNetwork: state.qrReducer.kuwaNetwork,
        qrStatus: state.qrReducer.qrStatus
    }
}

const mapDispatchToProps = dispatch => {
    return {
        startScanner: scanner => {
            dispatch(startScanner(scanner))
        },
        qrCodeFound: (kuwaId, scanner) => {
            dispatch(qrCodeFound(kuwaId, scanner))
        },
        mobileStartScanner: (component) => {
            dispatch(mobileStartScanner(component))
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(QRCode);