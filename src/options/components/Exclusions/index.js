import React from 'react';

import translator from '../../../lib/translator/translator';
import Title from '../ui/Title';
import Mode from './Mode';
import './settings.pcss';
import '../ui/radio.pcss';

const Settings = () => (
    <>
        <Title title={translator.translate('settings_exclusion_title')} />
        <div className="settings">
            <Mode />
        </div>
    </>
);

export default Settings;
