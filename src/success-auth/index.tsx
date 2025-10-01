import React from 'react';
import { Provider } from 'mobx-react';

import { createRoot } from 'react-dom/client';

import { translator } from '../common/translator';

import { App } from './App';

document.title = translator.getMessage('name');

const rootNode = document.getElementById('root')!;
const root = createRoot(rootNode);

root.render(
    <Provider>
        <App />
    </Provider>,
);
