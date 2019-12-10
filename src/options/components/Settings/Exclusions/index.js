import React, { Fragment, useContext } from 'react';
import browser from 'webextension-polyfill';
import { observer } from 'mobx-react';

import Form from './Form';
import List from './List';
import rootStore from '../../../stores';

const Exclusions = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        currentExclusionsType,
        toggleInverted,
    } = settingsStore;

    const onChange = type => async () => {
        await toggleInverted(type);
    };

    const titles = {
        [adguard.exclusions.TYPES.WHITELIST]: browser.i18n.getMessage('settings_exclusion_whitelist'),
        [adguard.exclusions.TYPES.BLACKLIST]: browser.i18n.getMessage('settings_exclusion_blacklist'),
    };

    const renderExclusions = (exclusionsType) => {
        const enabled = exclusionsType === currentExclusionsType;

        const getIconHref = (enabled) => {
            if (enabled) {
                return 'bullet_on';
            }
            return 'bullet_off';
        };

        return (
            <div className="settings__group">
                <div className="settings__subtitle" onClick={onChange(exclusionsType)}>
                    <svg className="settings__group-ico">
                        <use xlinkHref={`#${getIconHref(enabled)}`} />
                    </svg>
                    {titles[exclusionsType]}
                </div>
                <Form exclusionsType={exclusionsType} enabled={enabled} />
                <List exclusionsType={exclusionsType} enabled={enabled} />
            </div>
        );
    };

    return (
        <Fragment>
            <div className="settings__section">
                <div className="settings__title">
                    {browser.i18n.getMessage('settings_exclusion_title')}
                </div>
                {renderExclusions(adguard.exclusions.TYPES.BLACKLIST)}
                {renderExclusions(adguard.exclusions.TYPES.WHITELIST)}
            </div>
        </Fragment>
    );
});

export default Exclusions;
