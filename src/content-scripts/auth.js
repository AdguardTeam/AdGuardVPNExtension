import browser from 'webextension-polyfill';

// TODO [maximtop] send message only if authentication started (consider how to do it)
browser.runtime.sendMessage({ type: 'authenticateSocial', queryString: window.location.href.split('#')[1] });
