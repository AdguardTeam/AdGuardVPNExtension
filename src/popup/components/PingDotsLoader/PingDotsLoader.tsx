import React, { type ReactElement } from 'react';

import './ping-dots-loader.pcss';

export const PingDotsLoader = (): ReactElement => (
    <div className="ping-dots-loader">
        <span className="ping-dots-loader__dot" />
        <span className="ping-dots-loader__dot" />
        <span className="ping-dots-loader__dot" />
    </div>
);
