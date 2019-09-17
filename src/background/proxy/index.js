// TODO [maximtop] check if this method is suitable
//  https://webpack.js.org/plugins/normal-module-replacement-plugin/
// #if process.env.BROWSER === 'chrome'
export { proxy } from './chrome/proxy';
// #endif

// #if process.env.BROWSER === 'firefox'
// export { proxy } from './firefox/proxy';
// #endif
