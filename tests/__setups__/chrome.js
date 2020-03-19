const chrome = require('sinon-chrome');

if (!chrome.runtime.id) {
    chrome.runtime.id = 'test';
}

global.chrome = chrome;
