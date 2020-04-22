import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';

import './styles/main.pcss';

import App from './components/App';

(async () => {
    ReactDOM.render(
        <Provider>
            <App />
        </Provider>,
        document.getElementById('root')
    );
})();
