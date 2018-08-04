import React, { Component } from 'react';
import './valid_kuwa_ids.css';
import Popup from 'reactjs-popup';
import 'bootstrap/dist/css/bootstrap.min.css';
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';
import '../../../node_modules/react-bootstrap-table/dist/react-bootstrap-table-all.min.css';  
import {
  Alert,
  InputGroup,
  InputGroupAddon,
  InputGroupButtonDropdown,
  InputGroupDropdown,
  Input,
  InputGroupText,
  Fade,
  Collapse,
  Container,
  Row,
  Label,
  Col,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  UncontrolledDropdown,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import loading from '../../loading.gif'
require('dotenv').config()

const Web3 = require('web3')
const axios = require('axios')
const EthereumTx = require('ethereumjs-tx')
const log = require('ololog').configure({ time: true })
const ansi = require('ansicolor').nice



function blockLinks(cell, row){
  return `<a href="https://rinkeby.etherscan.io/address/${cell}" target="_blank">${cell}</a>`;
}

function amountFormatter(cell,row){
  return `<div>2</div>`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}




class KuwaFaucet extends Component {

  constructor(props) {
    super(props);

    this.options = {
      defaultSortName: 'timestamp',  // default sort column name
      defaultSortOrder: 'desc'  // default sort order
    };

    this.state = {
      isLoading: true,
      sponsorship_requests: [],
      dropdownOpen: false,
      dropdownValue: 'Choose currency',
      visible: false,
      amountBox: null,
      fadeIn: true,
      payButtonDisabled: true,
      defaultAmount: '0.02'
    }

    this.toggle = this.toggle.bind(this);

    this.toggleDropDown = this.toggleDropDown.bind(this);

    this.onPayBtnClick = this.onPayBtnClick.bind(this);

    this.onDismiss = this.onDismiss.bind(this);

    this.handleChange = this.handleChange.bind(this);


  }


  toggle() {
    this.setState({
      isLoading: !this.state.isLoading,
    });
  }

  toggleDropDown(e) {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen,
      dropdownValue: e.currentTarget.textContent,
      payButtonDisabled: false
    });

    console.log(e.currentTarget.textContent);
  }

  onPayBtnClick(){
    this.setState({
      visible: true

    });
    console.log('h12');

    var amt = this.state.amountBox
    console.log(amt);

    



  }

  onDismiss() {
    this.setState({ visible: false });
  }

  handleChange({ target }) {
    this.setState({
      [target.name]: target.value
    });

    
  }


  componentDidMount(){
    
     this.interval = setInterval(() => {
        axios.get('/sponsorship_requests/Test')
         .then(res => {
          this.setState({sponsorship_requests : res.data.sponsorship_requests});
          this.setState({isLoading : false});
        })}, 1000);

    //example get request to verify ajax is working

    // axios.get('https://api.iextrading.com/1.0/ref-data/symbols')
    //      .then(res => {
    //       console.log(res.data);
    //       this.setState({sponsorship_requests : res.data[0]});
    //     })      

    //update: it is working but ajax cant track changes in database without a page refresh.

    // axios.get('/sponsorship_requests/MySharedSecretKey')
    //      .then(res => {
    //       console.log(res.data);
    //       this.setState({sponsorship_requests : res.data.sponsorship_requests});
    //     })      



   }

  componentWillUnmount() {
  clearInterval(this.interval);
  }

  render() {

    const cellEditProp = {
      mode: 'click',
    };
    if(this.state.isLoading === false){
     return (
      <div>
        
        <Container>
          <Row>  
          
          <InputGroup>
          
          <Col>
          <Input placeholder="Enter Standard Payment Amount" maxLength="10" name="amountBox" value={ this.state.amountBox } onChange={ this.handleChange }/>
          </Col>
          
          <Col>
          <InputGroupButtonDropdown addonType="append" isOpen={this.state.dropdownOpen} toggle={this.toggleDropDown}>
            <DropdownToggle caret>
              {this.state.dropdownValue}
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem>KuwaCoin</DropdownItem>
              <DropdownItem divider />
            </DropdownMenu>
          </InputGroupButtonDropdown>
          </Col>

          </InputGroup>
          </Row>
          <Row>
          <Col>
          <InputGroupAddon>
          <Label check>
                <Input type="checkbox" id="checkbox2" defaultChecked />{'Use Standard Payment Amount for All'}
                
              </Label>
          </InputGroupAddon>
          </Col>
          </Row>
        </Container>


        <br />
          <Button id="faucet-payment-button" color="success" size="lg" disabled={this.state.payButtonDisabled} onClick={this.onPayBtnClick}>Pay</Button>{' '}
          <Alert color="info" isOpen={this.state.visible} toggle={this.onDismiss} fade={this.state.fadeIn} >
        { this.state.amountBox } KuwaCoins are being sent to each of the valid Kuwa IDs
      </Alert>
          <br />
          <br />
          
          <BootstrapTable data={this.state.sponsorship_requests} options={this.options} cellEdit={ cellEditProp } pagination>
            
              <TableHeaderColumn dataField="timestamp" filter={ { type: 'TextFilter', delay: 200 }} isKey dataSort editable={ false } hidden={ true }> Time </TableHeaderColumn>
              <TableHeaderColumn dataField="client_address" dataSort editable={ false }> Valid Kuwa IDs (Ethereum Addresses)</TableHeaderColumn>
              <TableHeaderColumn dataField="contract_address" dataSort dataFormat={blockLinks} editable={ false }> Registration Contract Address</TableHeaderColumn>
              <TableHeaderColumn dataField="amount" dataSort dataFormat={amountFormatter} > Amount in ({this.state.dropdownValue}) </TableHeaderColumn>

        </BootstrapTable>
      </div>
    ); 
    }
    else{
      return (
      <div className="loading">
      
      <img className="isLoading" src={loading} alt="loading..." />

      </div>
      );
    }
    
  }
}

export default KuwaFaucet;
  
