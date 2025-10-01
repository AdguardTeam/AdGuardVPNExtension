import React, { type ReactElement } from 'react';

import './dots-loader.pcss';

export const DotsLoader = (): ReactElement => (
    <div className="dots-loader">
        <span className="dots-loader__dot" />
        <span className="dots-loader__dot" />
        <span className="dots-loader__dot" />
    </div>
);
