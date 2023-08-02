import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'mobx-react';

import { App } from './components/App';
import { translator } from '../common/translator';

document.title = translator.getMessage('options_title');

const rootNode = document.getElementById('root')!;
const root = createRoot(rootNode);

// TODO add fallback screen with possibilities to export logs
root.render(
    <Provider>
        <App />
    </Provider>,
);
