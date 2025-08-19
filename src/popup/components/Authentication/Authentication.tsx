import React from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { Authorization } from './Authorization';
import { PolicyAgreement } from './PolicyAgreement';

import './auth.pcss';

export const Authentication = observer(() => {
    const getForm = (step: string) => {
        switch (step) {
            case 'policyAgreement': {
                return <PolicyAgreement />;
            }
            default: {
                return <Authorization />;
            }
        }
    };

    const containerClassNames = classNames('auth__container', {
        'auth__container--agreement': true,
    });

    return (
        <div className="auth">
            <div className={containerClassNames}>
                {getForm('policyAgreement')}
            </div>
        </div>
    );
});
