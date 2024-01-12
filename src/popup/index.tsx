import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'mobx-react';

import './styles/main.pcss';

import { App } from './components/App';

const rootNode = document.getElementById('root')!;
const root = createRoot(rootNode);

root.render(
    <Provider>
        <App />
    </Provider>,
);
