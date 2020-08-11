import React from 'react';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';

import SubdomainsHelp from '../Mode/SubdomainsHelp';

const SubdomainsCheckbox = ({
    id,
    checked,
}) => {
    return (
        <div className="checkbox checkbox--subdomain">
            <label htmlFor={id} className="checkbox__label">
                {checked ? (
                    <svg className="icon icon--button icon--checked">
                        <use xlinkHref="#checked" />
                    </svg>
                ) : (
                    <svg className="icon icon--button icon--unchecked">
                        <use xlinkHref="#unchecked" />
                    </svg>
                )}
                <span className="checkbox__label-title">{reactTranslator.translate('settings_exclusion_subdomains_include')}</span>
            </label>
            <div className="checkbox__help">
                <SubdomainsHelp />
            </div>
        </div>
    );
};

export default SubdomainsCheckbox;
