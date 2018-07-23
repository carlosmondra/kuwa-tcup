import React, { Component } from 'react';
import logo from './Kuwa.png';
import './App.css';

class App extends Component {

    constructor() {
        super();
        this.state = {
            registrations:[]
        };
    }

    componentDidMount() {
        this.interval = setInterval(() => {
            fetch('/registration')
	            .then(response => response.json())
	            .then(table => this.setState({registrations: table}))
	            .then(console.log('DB =', this.state.registrations))
        }, 3000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h1 className="App-title">Kuwa Registrar Database (Moe)</h1>
                </header>
                <table id="tableIdToFill">
			<tbody>
	                        <tr>
                                    <th>Index</th>
        	                    <th>Client Address</th>
                	            <th>Contract Address</th>
                        	    <th>Timestamp(UTC)</th>
	                            <th>Registration Status</th>
        	                </tr>
                	        {this.state.registrations.map((row, index) =>
		                <tr key={row.registration_id}>
                                    <td>{index+1}</td>
	                            <td><a href={"https://rinkeby.etherscan.io/address/"+row.client_address}
                                           target="_blank" rel="noopener noreferrer">{row.client_address}</a></td>
	                            <td><a href={"https://rinkeby.etherscan.io/address/"+row.contract_address}
                                           target="_blank" rel="noopener noreferrer">{row.contract_address}</a></td>
        	                    <td>{row.timestamp}</td>
                	            <td>{row.status}</td>
                        	</tr>)}
			</tbody>
                </table>
            </div>
        );
    }
}

export default App;
