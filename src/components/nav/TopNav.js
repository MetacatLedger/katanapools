import React, {Component} from 'react';
import {Navbar,Nav, NavItem } from 'react-bootstrap';
import {Link} from 'react-router-dom';
import './nav.scss';
import { LinkContainer } from 'react-router-bootstrap';
import AddressDisplay from '../common/AddressDisplay';

export default class TopNav extends Component {
  render() {
    const {user: {providerConnected}} = this.props;

    let addressBar = <span/>;
    let currentConnection = <span/>;
    if (!providerConnected) {
      currentConnection = <div className="provider-connection-error">No Metamask connection detected.</div>
    }
    if (window.web3 && window.web3.currentProvider) {
     const selectedAddress = window.web3.currentProvider.selectedAddress;
     const currentNetwork = window.web3.currentProvider.networkVersion;
     if (currentNetwork && selectedAddress) {

     addressBar = <AddressDisplay address={selectedAddress}/>
     if (currentNetwork.toString() === '1') {
       currentConnection = <div className="connection-string">Connected to Mainnet</div>;
     }
     if (currentNetwork.toString() === '3') {
       currentConnection = <div className="connection-string">Connected to Ropsten</div>;
     }
     }
    }

    return (
      <div>
      <Navbar  expand="lg" className="app-top-nav">
        <Navbar.Brand href="/">Katana Pools</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar id="basic-navbar-nav">
          <Nav className="mr-auto">
            <LinkContainer to="/explore">
              <NavItem key={1}>Explore Tokens</NavItem>
            </LinkContainer>
            <LinkContainer to="/pool/view">
              <NavItem key={2}>Explore Pools</NavItem>
            </LinkContainer>
            <LinkContainer to="/pool/create">
              <NavItem key={3}>Create Pool</NavItem>
            </LinkContainer>
          </Nav>
        </Navbar>
        <div>
         {currentConnection}
         {addressBar}
        </div>
      </Navbar>
      </div>
      )
  }
}