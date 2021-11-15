import React from 'react';

import { reactTranslator } from '../../../common/reactTranslator';
import { Title } from '../ui/Title';
import { ModeSelector } from './ModeSelector';
import { Search } from './Search';

import './exclusions.pcss';
import '../ui/radio.pcss';

export const Exclusions2 = () => {
    return (
        <>
            <Title title={reactTranslator.getMessage('settings_exclusion_title')} />
            <div className="settings">
                <ModeSelector />
                <Search />
            </div>
        </>
    );
};
