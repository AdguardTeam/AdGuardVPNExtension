// !IMPORTANT!
// export './stateStorage/stateStorage.abstract' is replaced during webpack compilation
// with NormalModuleReplacementPlugin to proper implementation for the manifest version
// from './stateStorage/mv2' or './stateStorage/mv3'
export { sessionState } from './stateStorage/stateStorage.abstract';
