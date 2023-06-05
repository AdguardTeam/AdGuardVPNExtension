import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';

import { App } from './components/App';
import { EventsListener } from './components/EventsListener';
import { translator } from '../common/translator';

document.title = translator.getMessage('options_title');

// TODO add fallback screen with possibilities to export logs
(async () => {
    ReactDOM.render(
        <Provider>
            <App />
            <EventsListener />
        </Provider>,
        document.getElementById('root'),
    );
})();
