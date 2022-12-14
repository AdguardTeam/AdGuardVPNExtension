import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';

import { App } from './components/App';
import { translator } from '../common/translator';

document.title = translator.getMessage('options_title');

// TODO add fallback screen with possibilities to export logs
(async () => {
    ReactDOM.render(
        <Provider>
            <App />
        </Provider>,
        document.getElementById('root'),
    );
})();
