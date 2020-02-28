export const DEPLOY_SMART_TOKEN_INIT = 'DEPLOY_SMART_TOKEN_INIT';

export const DEPLOY_SMART_TOKEN_PENDING = 'DEPLOY_SMART_TOKEN_PENDING';

export const DEPLOY_SMART_TOKEN_RECEIPT = 'DEPLOY_SMART_TOKEN_RECEIPT';

export const DEPLOY_SMART_TOKEN_CONFIRMATION = 'DEPLOY_SMART_TOKEN_CONFIRMATION';

export const DEPLOY_SMART_TOKEN_ERROR = 'DEPLOY_SMART_TOKEN_ERROR';

export const DEPLOY_SMART_TOKEN_SUCCESS = 'DEPLOY_SMART_TOKEN_SUCCESS';

export const DEPLOY_RELAY_CONVERTER_STATUS = 'DEPLOY_RELAY_CONVERTER_STATUS';

export const SET_CONVERTER_CONTRACT_RECEIPT = 'SET_CONVERTER_CONTRACT_RECEIPT';

export const SET_POOL_FUNDED_STATUS = 'SET_POOL_FUNDED_STATUS';

export const SET_ACTIVATION_STATUS = 'SET_ACTIVATION_STATUS';

export const SET_POOL_CREATION_RECEIPT = 'SET_POOL_CREATION_RECEIPT';

export const SET_CURRENT_SELECTED_POOL = 'SET_CURRENT_SELECTED_POOL';

export function setCurrentSelectedPool(payload) {
  return {
    type: SET_CURRENT_SELECTED_POOL,
    payload: payload
  }
}

export function setPoolCreationReceipt(receipt) {
  return {
    type: SET_POOL_CREATION_RECEIPT,
    payload: receipt
  }
}

export function setPoolFundedStatus(payload) {
  return {
    type: SET_POOL_FUNDED_STATUS,
    payload: payload
  }
}

export function setRelayTokenContractReceipt(payload) {
  return {
    type: SET_CONVERTER_CONTRACT_RECEIPT,
    payload: payload
  }
}


export function deploySmartTokenInit(payload) {
  return {
    type: DEPLOY_SMART_TOKEN_INIT,
    payload: payload
  }
}

export function deploySmartTokenPending(payload) {
  return {
    type: DEPLOY_SMART_TOKEN_PENDING,
    payload: payload
  }
}

export function deploySmartTokenReceipt(payload) {

  return {
    type: DEPLOY_SMART_TOKEN_RECEIPT,
    payload: payload
  }
}

export function deploySmartTokenConfirmation(payload) {

  return {
    type: DEPLOY_SMART_TOKEN_CONFIRMATION,
    payload: payload
  }
}

export function deploySmartTokenError(payload) {
  return {
    type: DEPLOY_SMART_TOKEN_ERROR,
    payload: payload
  }
}

export function deploySmartTokenSuccess(payload) {
  return {
    type: DEPLOY_SMART_TOKEN_SUCCESS,
    payload: payload
  }
}

export function deployRelayConverterStatus(payload) {
  return {
    type: DEPLOY_RELAY_CONVERTER_STATUS,
    payload: payload
  }
}

export function setActivationStatus(payload) {
  return {
    type: SET_ACTIVATION_STATUS,
    payload: payload
  }
}