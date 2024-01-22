import React from 'react';
import { Provider } from 'mobx-react';

import { createRoot } from 'react-dom/client';

import { App } from './components/App';

import './styles/main.pcss';

const rootNode = document.getElementById('root')!;
const root = createRoot(rootNode);

root.render(
    <Provider>
        <App />
    </Provider>,
);
