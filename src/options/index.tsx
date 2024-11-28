import React from 'react';
import { Provider } from 'mobx-react';

import { createRoot } from 'react-dom/client';

import { translator } from '../common/translator';

import { App } from './components/App';

import './styles/main.pcss';

document.title = translator.getMessage('options_title');

const rootNode = document.getElementById('root')!;
const root = createRoot(rootNode);

// TODO add fallback screen with possibilities to export logs
root.render(
    <Provider>
        <App />
    </Provider>,
);
