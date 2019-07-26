// #if process.env.BROWSER === 'chrome'
console.log('chrome');
export { proxy } from './chrome/proxy';
// #endif

// #if process.env.BROWSER === 'firefox'
console.log('firefox');
export { proxy } from './firefox/proxy';
// #endif
