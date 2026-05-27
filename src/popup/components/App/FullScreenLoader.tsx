import React, { type ReactElement } from 'react';

import { DotsLoader } from '../../../common/components/DotsLoader';

/**
 * Full-screen dots loader shown during initialization stages.
 */
export function FullScreenLoader(): ReactElement {
    return (
        <div className="data-loader">
            <DotsLoader />
        </div>
    );
}
