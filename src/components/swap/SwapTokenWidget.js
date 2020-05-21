import React, {Component} from 'react';
import { Row, Col, Button, Form} from 'react-bootstrap';
import './swapToken.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowRight,  faChevronCircleDown, faSpinner } from '@fortawesome/free-solid-svg-icons'
import Autosuggest from 'react-autosuggest';
import {toDecimals, fromDecimals} from '../../utils/eth';
import {getConvertibleTokensInRegistry, getReturnValueData, getPathTypesFromNetworkPath,
  getExpectedReturn, submitSwapToken,getNetworkPathMeta, getBalanceOfToken, getDecimalsOfToken
} from '../../utils/ConverterUtils';
import {isNonEmptyArray} from '../../utils/ObjectUtils';

import {Decimal} from 'decimal.js';
var RegistryUtils = require('../../utils/RegistryUtils');

const Initial_State = {'showTransaferSelect': false, 'showReceiveSelect': false, selectedTransferToken: {}, selectedReceiveToken: {},
          transferAmount: 1000, receiveAmount: 0, totalFee: 0, transactionFee: 0, 'ConverterRegistryContractAddress': '',
           networkPath: [], pathMeta: [], widgetError: ''
        };

export default class SwapTokenWidget extends Component {

  constructor(props, context) {
    super(props);
    this.web3 = window.web3;
        this.state = Initial_State;
  }

  getConversionData = (fromToken, toToken, amount) => {
    this.props.fetchTokenPathsWithRates(fromToken, toToken, "from", amount);
  }


    openTransferSelectDropdown = () => {
      this.setState({showTransaferSelect: !this.state.showTransaferSelect});
    }

    openReceiveSelectDropdown = () => {
      this.setState({showReceiveSelect: !this.state.showReceiveSelect});
    }

    transferSelectChanged = (val) => {
      const {transferAmount} = this.state;
      this.setState({selectedTransferToken: val, showTransaferSelect: false});
          this.getConversionData(val, this.state.selectedReceiveToken, transferAmount);
    }

    receiveSelectChanged = (val) => {
      const {transferAmount} = this.state;
      this.setState({selectedReceiveToken: val, showReceiveSelect: false});
      this.getConversionData(this.state.selectedTransferToken, val, transferAmount);
    }

  componentWillMount() {
    const {toAmount, tokenData, smartTokenCheck, convertibleTokenCheck} = this.props;
    if ( tokenData.length > 0) {
      const self = this;
      const {transferAmount} = this.state;
      this.setState({selectedTransferToken: tokenData[0], selectedReceiveToken: tokenData[1]});
      if (transferAmount > 0) {
      self.getConversionData(tokenData[0], tokenData[1],
                    transferAmount)}
    }
  }
  componentWillReceiveProps(nextProps) {
    const {toAmount, tokenData, smartTokenCheck, convertibleTokenCheck, fromPathListWithRate, fromPathLoading} = nextProps;


    if (toAmount !== this.props.toAmount) {
      this.setState({receiveAmount:toAmount });
    }

    if ( tokenData.length > 0 && tokenData.length !== this.props.tokenData.length) {
      const self = this;
      const {transferAmount} = this.state;
      this.setState({selectedTransferToken: tokenData[0], selectedReceiveToken: tokenData[1]});
      if (transferAmount > 0) {
      self.getConversionData(tokenData[0], tokenData[1],
                    transferAmount)}
    };
    
    if (this.props.fromPathLoading && !nextProps.fromPathLoading && isNonEmptyArray(fromPathListWithRate))
    {
      const nextFromPath = fromPathListWithRate;
      let bestRate = nextFromPath[0].price;
      let bestPath = nextFromPath[0].path;

      nextFromPath.forEach(function(item){
        if (item.price > bestRate) {
          bestRate = item.price;
          bestPath = item.path;
        }
      });

      this.setState({networkPath: bestPath, receiveAmount: bestRate, pathMeta: bestPath});


    }
  }

  componentWillUnmount() {
    this.setState(Initial_State);
  }

  transferAmountChanged = (evt) => {
    const {transferAmount} = this.state;
    const newTransferAmount = evt.target.value;
    this.setState({transferAmount: newTransferAmount});
    if (newTransferAmount > 0) {
      this.getConversionData(this.state.selectedTransferToken, this.state.selectedReceiveToken, newTransferAmount);
    }
  }

  submitSwapTransaction = () => {
    const {networkPath, transferAmount, selectedTransferToken} = this.state;
    
    const path = networkPath.map((i)=>(i.address));
    const self = this;

    let isEth = false;
    if (selectedTransferToken.symbol === 'ETH') {
      isEth = true;
    }

    getDecimalsOfToken(selectedTransferToken.address).then(function(tokenDecimals){

    const fromAmount = toDecimals(transferAmount, tokenDecimals);

    getBalanceOfToken(selectedTransferToken.address, isEth).then(function(balanceResponse){
      const availableBalance = new Decimal(fromDecimals(balanceResponse, tokenDecimals));
      const requiredBalance = new Decimal(transferAmount);
      if (requiredBalance.lessThan(availableBalance)) {
          self.setState({'widgetError': ''});
          submitSwapToken(path, fromAmount, selectedTransferToken.address, isEth).then(function(response){
        }).catch(function(err){
          if (err.message) {
            self.setState({'widgetError': err.message});
          }
        })
      } else {
        self.setState({'widgetError': 'Insufficient balance for this transaction'});
      }
    });
    })

  }

  receiveAmountChanged = (evt) => {
    // Do nothing as this is readonly
  }

  render() {
    const {tokenData} = this.props;

    const {showTransaferSelect, selectedTransferToken, selectedReceiveToken, showReceiveSelect,
      transferAmount, receiveAmount, totalFee, pathMeta, transactionFee, widgetError
    } = this.state;

    let transferFromTokenSelect = <span/>;
    let receiveToTokenSelect = <span/>;

    if (showTransaferSelect) {
        transferFromTokenSelect =
        (<div className="token-select-dropdown">
          <TokenSuggestionList tokenData={tokenData} tokenSelectChanged={this.transferSelectChanged}/>
        </div>
        )
    }
    if (showReceiveSelect) {
      receiveToTokenSelect = (
        <div className="token-select-dropdown">
          <TokenSuggestionList tokenData={tokenData} tokenSelectChanged={this.receiveSelectChanged}/>
        </div>
        )
    }


    if (tokenData.length === 0 ||  selectedTransferToken === undefined ||  selectedReceiveToken === undefined) {
      return (
      <div className="swap-token--loading-container">
      <div className="spinner-icon">
              <FontAwesomeIcon icon={faSpinner} size="lg" rotation={270} pulse/>
      </div>
      </div>);
    }

    let pathMetaData = <span/>;
    if (pathMeta && pathMeta.length > 0) {
      pathMetaData = pathMeta.map(function(item, idx){
        let pointerArrow = <span/>;

        if (idx < pathMeta.length - 1) {
          pointerArrow =
          <div className="arrow-right-container">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
        }
        return (
        <div className="meta-item-cell-container" key={idx}>
          <div className="meta-item-cell">
            <div className="token-label-cell">{item.meta.symbol}</div>
            <div className="token-name-cell">{item.meta.name}</div>
          </div>
          {pointerArrow}
        </div>)
      })
    }
    let errorData = <span/>;
    if (widgetError && widgetError.length > 0) {
      errorData = <div className="error">{widgetError}</div>
    }
    return (
      <div className="swap-token-container">
        <div className="card">
          <div className="text">
          <Row>
          <Col lg={5}>
              <div className="h4 token-transfer-label">Transfer </div>
            <div className="token-label-amount-container">
               <Row>
               <Col lg={4} className="token-label-select-col">
               <div className="token-label-container" onClick={this.openTransferSelectDropdown}>
                 <img src={selectedTransferToken.imageURI} className="token-preview-image"/>
                 <div className="token-preview-text">{selectedTransferToken.symbol}</div>
                 <FontAwesomeIcon icon={faChevronCircleDown} className="dropdown-circle"/>
               </div>
               {transferFromTokenSelect}
               </Col>
               <Col lg={8} className="token-amount-col">
                <Form.Control size="sm" type="number" placeholder="Amount" onChange={this.transferAmountChanged} value={transferAmount}/>
               </Col>
               </Row>
              </div>
            </Col>
          <Col lg={2}>
          <div className="token-transfer-arrow-container">
          <div>
          <FontAwesomeIcon icon={faArrowLeft} className="arrow-container"/>
          </div>
          <div className="bottom-arrow-container arrow-container">
          <FontAwesomeIcon icon={faArrowRight}/>
         </div>
          </div>
          </Col>
          <Col lg={5}>
            <div className="h4 token-transfer-label">Receive</div>
            <div className="token-label-amount-container">
               <Row>
                   <Col lg={4} className="token-label-select-col">
                   <div className="token-label-container" onClick={this.openReceiveSelectDropdown}>
                     <img src={selectedReceiveToken.imageURI} className="token-preview-image"/>
                     <div className="token-preview-text">{selectedReceiveToken.symbol}</div>
                     <FontAwesomeIcon icon={faChevronCircleDown} className="dropdown-circle"/>
                   </div>
                   {receiveToTokenSelect}
                   </Col>
                   <Col lg={8} className="token-amount-col">
                    <Form.Control size="sm" type="text" placeholder="Amount" value={receiveAmount}
                      onChange={this.receiveAmountChanged}/>
                   </Col>
               </Row>
              </div>
           </Col>
           </Row>
           <Row className="swap-action-btn-container">
           <Col lg={8}>
            {errorData}

           </Col>
           <Col lg={3}>
            Total Fees: {transactionFee} {selectedReceiveToken.symbol}
            </Col>
            <Col lg={1}>
            <Button onClick={this.submitSwapTransaction}>Swap</Button>
            </Col>
           </Row>
           <Row>
            <Col lg={12} className="network-path-label">
              Network path :
            </Col>
            <Col lg={12} className="network-path-data">
              {pathMetaData}
            </Col>
           </Row>
          </div>
        </div>
  </div>

      )
  }
}


class TokenSuggestionList extends Component {
  constructor() {
    super();
    const self = this;
    this.state = {
      value: '',
      suggestions: []
    };
  }
  componentDidMount() {
    const self = this;
  }
  onChange = (event, { newValue }) => {
    this.setState({
      value: newValue
    });
  };

  getSuggestions = (value) => {
    const {tokenData} = this.props;

    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0 ? [] : tokenData.filter(token =>
      token.name.toLowerCase().slice(0, inputLength) === inputValue || token.symbol.toLowerCase().slice(0, inputLength) === inputValue
    );
  }

  onSuggestionsFetchRequested = ({ value }) => {
    const self = this;
    this.setState({
      suggestions: self.getSuggestions(value)
    });
  };


  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  renderSuggestion = (suggestion) => {
     return (
      <div className="token-label-container">
         <img src={suggestion.imageURI} className="token-preview-image"/>
         <div className="token-preview-text">{suggestion.symbol}</div>
       </div>
       )
  }

  getSuggestionValue = (suggestion) => {
    this.props.tokenSelectChanged(suggestion);
    return suggestion.symbol;
  }

  render() {
    const { value, suggestions } = this.state;

    // Autosuggest will pass through all these props to the input.
    const inputProps = {
      placeholder: 'Search for a token',
      value,
      onChange: this.onChange
    };
    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={this.getSuggestionValue}
        renderSuggestion={this.renderSuggestion}
        inputProps={inputProps}
      />
    );
  }
}