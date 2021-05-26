import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';

import App from './components/App';
import { reactTranslator } from '../common/reactTranslator';

document.title = reactTranslator.getMessage('options_title');

(async () => {
    ReactDOM.render(
        <Provider>
            <App />
        </Provider>,
        document.getElementById('root'),
    );
})();
