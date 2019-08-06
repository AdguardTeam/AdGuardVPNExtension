import browser from 'webextension-polyfill';

browser.runtime.sendMessage({ type: 'authenticateSocial', queryString: window.location.href.split('?')[1] });
