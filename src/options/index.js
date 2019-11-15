import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import browser from 'webextension-polyfill';

import App from './components/App';

(async () => {
    const bgPage = await browser.runtime.getBackgroundPage();
    global.adguard = bgPage.adguard;
    ReactDOM.render(
        <Provider>
            <App />
        </Provider>,
        document.getElementById('root')
    );
})();
