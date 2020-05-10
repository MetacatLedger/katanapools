import React, {Component} from 'react';
import {Container, Row, Col, Form, Button, Alert, Tooltip, OverlayTrigger} from 'react-bootstrap';
import AddressDisplay from '../../common/AddressDisplay';
import {toDecimals, fromDecimals} from '../../../utils/eth';
import {isEmptyString} from '../../../utils/ObjectUtils';
import {VictoryChart, VictoryLine, VictoryAxis} from 'victory';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {  faPlus, faSpinner, faTimes, faQuestionCircle } from '@fortawesome/free-solid-svg-icons'

const BigNumber = require('bignumber.js');
const Decimal = require('decimal.js');
export default class SelectedPool extends Component {
  constructor(props) {
    super(props);
    this.state= {fundAmount: 0, liquidateAmount: 0, reserve1Needed: 0, reserve2Needed: 0}
  }

  onFundInputChanged = (evt) => {
    let inputFund = evt.target.value;
    this.calculateFundingAmount(inputFund);
    this.setState({fundAmount: inputFund});
  }

  onLiquidateInputChanged = (evt) => {
    let inputFund = evt.target.value;
    this.calculateLiquidateAmount(inputFund);
    this.setState({liquidateAmount: inputFund});
  }

  calculateLiquidateAmount = (inputFund) => {
    const {pool: {currentSelectedPool}} = this.props;
    if (!isNaN(inputFund) && parseFloat(inputFund) > 0) {
      const totalSupply = new BigNumber(fromDecimals(currentSelectedPool.totalSupply, currentSelectedPool.decimals));
      const removeSupply = new BigNumber(inputFund);
      const pcDecreaseSupply = removeSupply.dividedBy(totalSupply);
      const currentReserves = currentSelectedPool.reserves;

      const reservesAdded = currentReserves.map(function(item){
        const currentReserveSupply = new BigNumber(item.reserveBalance);
        const currentReserveAdded = pcDecreaseSupply.multipliedBy(currentReserveSupply);
        const currentReserveAddedMin = toDecimals(currentReserveAdded.toFixed(6), item.decimals);
        const currentReserveAddedDisplay = currentReserveAdded.toPrecision(6, 0);
        return Object.assign({}, item, {addedMin: currentReserveAddedMin, addedDisplay: currentReserveAddedDisplay});
      });
      this.setState({reservesAdded: reservesAdded});
    }
  }

  calculateFundingAmount = (inputFund) => {
    const {pool: {currentSelectedPool}} = this.props;
    if (!isNaN(inputFund) && parseFloat(inputFund) > 0) {
      const totalSupply = new Decimal(fromDecimals(currentSelectedPool.totalSupply, currentSelectedPool.decimals));
      const addSupply = new Decimal(inputFund);
      const pcIncreaseSupply = addSupply.dividedBy(totalSupply);

      const currentReserves = currentSelectedPool.reserves;
      const reservesNeeded = currentReserves.map(function(item){
        const currentReserveSupply = new Decimal(item.reserveBalance);
        const currentReserveNeeded = pcIncreaseSupply.times(currentReserveSupply);
        const currentReserveNeededMin = toDecimals(currentReserveNeeded.toFixed(2, Decimal.ROUND_UP), item.decimals);

        const currentReserveNeededDisplay = currentReserveNeeded.toFixed(6, Decimal.ROUND_UP);
        return Object.assign({}, item, {neededMin: currentReserveNeededMin, neededDisplay: currentReserveNeededDisplay});
      });
      this.setState({reservesNeeded: reservesNeeded});
    }
  }


  submitBuyPoolToken = () => {

    const {fundAmount, reservesNeeded} = this.state;
    const {pool: {currentSelectedPool}} = this.props;
    const self = this;
    const args = {poolTokenProvided: toDecimals(fundAmount, currentSelectedPool.decimals),
    reservesNeeded: reservesNeeded, converterAddress: currentSelectedPool.converter};

    let isError = false;
    const web3 = window.web3;

    const currentWalletAddress = web3.currentProvider ? web3.currentProvider.selectedAddress : '';
    if (isEmptyString(currentWalletAddress)) {
      isError = true;
      self.props.setErrorMessage(`You need to connect a web3 provider to make this transction.`);
    }
    else if (reservesNeeded.length > 0) {
      reservesNeeded.forEach(function(reserveItem){
        const amountNeeded = new Decimal(reserveItem.neededDisplay);
        const amountAvailable = new Decimal(reserveItem.userBalance);
        if (amountNeeded.greaterThan(amountAvailable)) {
          isError = true;
          self.props.setErrorMessage(`User balance for ${reserveItem.symbol} is less than needed amount of ${reserveItem.neededDisplay}`);
        }
      })
    }
    if (!isError) {
      this.props.resetErrorMessage();
      this.props.submitPoolBuy(args);
    }
  }

  submitSellPoolToken = () => {
    const {pool: {currentSelectedPool}} = this.props;
    const self = this;
    const existingPoolTokenBalance = fromDecimals(currentSelectedPool.senderBalance, currentSelectedPool.decimals);
    const {liquidateAmount, reservesAdded} = this.state;
    const args = {poolTokenSold: toDecimals(liquidateAmount, currentSelectedPool.decimals),
    reservesAdded: reservesAdded, converterAddress: currentSelectedPool.converter,
      'poolAddress': currentSelectedPool.address
    };
    let isError = false;

    const web3 = window.web3;

    const currentWalletAddress = web3.currentProvider ? web3.currentProvider.selectedAddress : '';
    if (isEmptyString(currentWalletAddress)) {
      isError = true;
      self.props.setErrorMessage(`You need to connect a web3 provider to make this transction.`);
    }

    if(parseFloat(liquidateAmount) > parseFloat(existingPoolTokenBalance)) {
      isError = true;
      this.props.setErrorMessage(`User balance for ${currentSelectedPool.symbol} is less than needed amount of ${liquidateAmount}`);
    }

    if (!isError){
      this.props.resetErrorMessage();
      this.props.submitPoolSell(args);
    }
  }
  showApprovalDialog = () => {
    const {pool: {currentSelectedPool}} = this.props;
    this.props.setTokenAllowances(1000000000, currentSelectedPool);
  }
  
  showRevokeDialog = () => {
    const {pool: {currentSelectedPool}} = this.props;
    this.props.revokeTokenAllowances(currentSelectedPool);
  }
  
  render() {
    const {pool: {currentSelectedPool, currentSelectedPoolError, poolHistory}, pool} = this.props;
    const {reservesNeeded, reservesAdded} = this.state;

    let reserveRatio = '';

    reserveRatio = currentSelectedPool.reserves && currentSelectedPool.reserves.length > 0 ?currentSelectedPool.reserves.map(function(item){
      if (item) {
      return parseInt(item.reserveRatio) / 10000;
      } else {
        return null;
      }
    }).filter(Boolean).join("/") : '';


    if (currentSelectedPoolError) {
      return (<div>
      <div>Could not fetch pool details.</div>
      <div>Currently only pool contracts which expose reserveTokenCount() and reserveTokens() methods are supported.</div>
      </div>)
    }
    const { fundAmount, liquidateAmount, isError, errorMessage } = this.state;

    let minTotalSupply = parseFloat(fromDecimals(currentSelectedPool.totalSupply, currentSelectedPool.decimals)).toFixed(4);
    let reserveTokenList = currentSelectedPool.reserves && currentSelectedPool.reserves.length > 0 ? currentSelectedPool.reserves.map(function(item, idx){
      return <div key={`token-${idx}`}>
        <div className="holdings-label">{item.name}</div>
        <div className="holdings-data">&nbsp;{parseFloat(item.reserveBalance).toFixed(4)}</div>
      </div>
    }) : <span/>;

    let userHoldingsList = currentSelectedPool.reserves && currentSelectedPool.reserves.length > 0 ? currentSelectedPool.reserves.map(function(item, idx){
      return (<div key={`token-${idx}`}>
        <div className="holdings-label">{item.name}</div>
        <div className="holdings-data">&nbsp;{parseFloat(item.userBalance).toFixed(4)}</div>
      </div>)
    }) : <span/>;

    let poolHoldings = "";
    if (currentSelectedPool.senderBalance) {
      poolHoldings = fromDecimals(currentSelectedPool.senderBalance, currentSelectedPool.decimals) + " " + currentSelectedPool.symbol;
    }
    let liquidateInfo = <span/>;
    if (liquidateAmount && liquidateAmount > 0) {
      liquidateInfo = (
        <div>
          <div>You will receive</div>
            {reservesAdded.map(function(item, idx){
              return <div key={`reserve-added-${idx}`}>{item.addedDisplay} {item.symbol}</div>
            })}
        </div>
        )
    }
    let fundInfo = <span/>;

    if (fundAmount && fundAmount > 0) {
      fundInfo = (
        <div>
            <div>You will needs to stake</div>
            {reservesNeeded.map(function(item, idx){
              return <div key={`reserve-needed-${idx}`}>{item.neededDisplay} {item.symbol}</div>
            })}
        </div>
        )
    }
    let conversionFee = "";
    if (currentSelectedPool && currentSelectedPool.conversionFee) {
       conversionFee = currentSelectedPool.conversionFee + "%";
    }

    let poolLiquidateAction = <span/>;
    let poolFundAction = <span/>;
    let tokenAllowances = <span/>;
    
    if (currentSelectedPool.reserves && currentSelectedPool.reserves.length > 0){
      poolLiquidateAction = (
        <div>
            <div className="action-label">Liquitate Pool Holdings</div>
            <Form.Control type="number" placeholder="Enter amount to liquidate" onChange={this.onLiquidateInputChanged}/>
            <div className="action-info-col">
            {liquidateInfo}
            <Button onClick={this.submitSellPoolToken} className="pool-action-btn">Sell</Button>
            </div>
        </div>
        )
      poolFundAction = (
        <div>
            <div className="action-label">Fund Pool Holdings</div>
            <Form.Control type="number" placeholder="Enter amount to fund" onChange={this.onFundInputChanged}/>
            <div className="action-info-col">
            {fundInfo}
            <Button onClick={this.submitBuyPoolToken} className="pool-action-btn">Purchase</Button>
            </div>
        </div>
        )
        
    let tokenAllowanceReserves = currentSelectedPool.reserves.map(function(item, idx){
      return <div key={`allowance-${idx}`} className="selected-pool-balance">
      {item.symbol} {item.userAllowance ? parseFloat(item.userAllowance).toFixed(5) : '-'}
      </div>
    });
    
    tokenAllowances = 
    <Row>
    <Col lg={8}>
      {tokenAllowanceReserves}
      </Col>
      <Col lg={4}>
      <Button onClick={this.showApprovalDialog}>Approve reserves </Button>
      <Button onClick={this.showRevokeDialog} className="revoke-approval-btn">Revoke approval </Button>
      </Col>
    </Row>
    }
    

function allowanceToolTip(props) {
   return <Tooltip {...props}>
    <div>Token allowances refer to amount you have approved the converter contract to spend.</div>
    <div>Set allowances for BancorConverter for faster pool funding and liquidation and save on Gas costs</div>
    
    </Tooltip>;
}


    return (
      <div>
        <Row className="select-pool-row-1">
          <Col lg={1} className="pool-logo-container">
            <img src={currentSelectedPool.imageURI} className="selected-pool-image"/>
          </Col>
          <Col lg={2}>
            <div className="cell-label">{currentSelectedPool.symbol}</div>
            <div className="cell-data">{currentSelectedPool.name}</div>
          </Col>
          <Col lg={2}>
           <div className="cell-label">Address</div>
           <div className="cell-data"><AddressDisplay address={currentSelectedPool.address}/></div>
          </Col>
          <Col lg={2}>
            <div className="cell-label">Pool Supply</div>
            <div className="cell-data">{minTotalSupply}</div>
          </Col>
          <Col lg={3}>
            <div>
              <div className="cell-label">Reserves</div>
              <div className="cell-data">{reserveTokenList}</div>
            </div>
          </Col>
          <Col lg={2}>
            <div className="cell-label">Reserve Ratio</div>
            <div className="cell-data">{reserveRatio}</div>
          </Col>
        </Row>
        <Row className="selected-pool-meta-row">
          <Col lg={3}>
            <div className="cell-label">Conversion fee generated</div>
            <div className="cell-data">{conversionFee}</div>
          </Col>
          <Col lg={3}>
            <div className="cell-label">Your pool token holdings</div>
            <div className="cell-data">{poolHoldings}</div>
          </Col>
          <Col lg={4}>
            <div className="cell-label">Your reserve token holdings</div>
            <div className="cell-data">{userHoldingsList}</div>
          </Col>
        </Row>
        <Row>
         <Col lg={12}>
          <div className="pool-allowance-container">
           <div className="allowance-label">
           Your pool allowances 
           <OverlayTrigger
              placement="right"
              delay={{ show: 250, hide: 400 }}
              overlay={allowanceToolTip}>
              <FontAwesomeIcon icon={faQuestionCircle} className="info-tooltip-btn"/>
            </OverlayTrigger>
           </div>
           
           {tokenAllowances}
         
           </div>
         </Col>
        </Row>
         <div className="pool-action-container">
        <Row className="selected-pool-buy-sell-row">
       
          <Col lg={5}>
            {poolFundAction}
          </Col>
          <Col lg={5}>
            {poolLiquidateAction}
          </Col>
        
        </Row>
    </div>  
      </div>

      )
  }
}

class VolumeGraph extends Component {
  componentWillMount() {
    const {selectedPool} = this.props;
    this.props.fetchConversionVolume(selectedPool);
  }

  componentWillReceiveProps(nextProps) {
    const {selectedPool, selectedPool: {symbol}} = nextProps;
    if (symbol !== this.props.selectedPool.symbol || (selectedPool.reserves && selectedPool.reserves.length > 0 && !this.props.selectedPool.reserves)) {
      this.props.fetchConversionVolume(selectedPool);
    }
  }
  componentWillUnmount() {
    this.props.resetPoolHistory();
  }
  render() {
    const web3 = window.web3;
    const currentNetwork = web3.currentProvider.networkVersion;
    const {poolHistory, selectedPool: {symbol}} = this.props;

    let graphData = poolHistory.map(function(item){

      return {x: moment(item.timeStamp).format('MM-DD'), y: parseInt(item.data)}
    });

    if (graphData.length == 0) {
      return <div className="graph-message-text">Volume graph data not available</div>
    }


    if (currentNetwork !== '1') {
      return <div className="graph-message-text">Volume graph is available only on mainnet</div>
    }
    return (
      <div>
      <VictoryChart

>
  <VictoryLine
    style={{
      data: { stroke: "#c43a31" },
      parent: { border: "1px solid #ccc"}
    }}
    data={graphData}
      />
      <VictoryAxis dependentAxis/>
      <VictoryAxis fixLabelOverlap={true}/>

    </VictoryChart>
    <div className="h7 text-center">Daily conversion vol from reserve to {symbol} (ETH)</div>
    </div>

      )
  }
}