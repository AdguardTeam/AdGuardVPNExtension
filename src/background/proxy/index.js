// #if process.env.BROWSER === 'chrome'
export { proxy } from './chrome/proxy';
// #endif

// #if process.env.BROWSER === 'firefox'
export { proxy } from './firefox/proxy';
// #endif
