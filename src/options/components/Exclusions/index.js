import React from 'react';

import Mode from './Mode';
import { Title } from '../ui/Title';
import { reactTranslator } from '../../../common/reactTranslator';

import './settings.pcss';
import '../ui/radio.pcss';

const Settings = () => (
    <>
        <Title title={reactTranslator.getMessage('settings_exclusion_title')} />
        <div className="settings">
            <Mode />
        </div>
    </>
);

export default Settings;
