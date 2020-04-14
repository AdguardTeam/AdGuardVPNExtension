import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import browser from 'webextension-polyfill';

import './styles/main.pcss';

import App from './components/App';

(async () => {
    // TODO remove when background page change to the messaging
    const bgPage = await browser.runtime.getBackgroundPage();
    global.adguard = bgPage.adguard;
    ReactDOM.render(
        <Provider>
            <App />
        </Provider>,
        document.getElementById('root')
    );
})();
