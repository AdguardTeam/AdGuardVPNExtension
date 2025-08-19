import React from 'react';
import { observer } from 'mobx-react';

import { PolicyAgreement } from './PolicyAgreement';

import './auth.pcss';

export const Authentication = observer(() => {
    return (
        <div className="auth">
            <div className="auth__container auth__container--agreement">
                <PolicyAgreement />
            </div>
        </div>
    );
});
