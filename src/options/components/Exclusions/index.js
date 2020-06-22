import React from 'react';

import Title from '../ui/Title';
import Mode from './Mode';
import './settings.pcss';
import '../ui/radio.pcss';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

const Settings = () => (
    <>
        <Title title={reactTranslator.translate('settings_exclusion_title')} />
        <div className="settings">
            <Mode />
        </div>
    </>
);

export default Settings;
