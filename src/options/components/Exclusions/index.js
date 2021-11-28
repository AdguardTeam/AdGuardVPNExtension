import React from 'react';

import Mode from './Mode';
import { Title } from '../ui/Title';
import { reactTranslator } from '../../../common/reactTranslator';

import './exclusions.pcss';
import '../ui/radio.pcss';

const Exclusions = function () {
    return (
        <>
            <Title title={reactTranslator.getMessage('settings_exclusion_title')} />
            <div className="settings">
                <Mode />
            </div>
        </>
    );
};

export default Exclusions;
