import React, { Fragment, useContext } from 'react';
import browser from 'webextension-polyfill';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import Form from './Form';
import List from './List';
import rootStore from '../../../stores';

const Mode = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        currentExclusionsType,
        toggleInverted,
    } = settingsStore;

    const onChange = type => async () => {
        await toggleInverted(type);
    };

    const types = [
        adguard.exclusions.TYPES.BLACKLIST,
        adguard.exclusions.TYPES.WHITELIST,
    ];

    const titles = {
        [adguard.exclusions.TYPES.BLACKLIST]: {
            title: browser.i18n.getMessage('settings_exclusion_regular_title'),
            description: browser.i18n.getMessage('settings_exclusion_regular_description'),
        },
        [adguard.exclusions.TYPES.WHITELIST]: {
            title: browser.i18n.getMessage('settings_exclusion_selective_title'),
            description: browser.i18n.getMessage('settings_exclusion_selective_description'),
        },
    };

    const renderControls = (exclusionsType) => {
        const enabled = exclusionsType === currentExclusionsType;

        const getIconHref = (enabled) => {
            if (enabled) {
                return 'bullet_on';
            }
            return 'bullet_off';
        };

        const titleClass = classnames('radio__title', { 'radio__title--active': enabled });

        return (
            <div className="radio" onClick={onChange(exclusionsType)}>
                <svg className="radio__icon">
                    <use xlinkHref={`#${getIconHref(enabled)}`} />
                </svg>
                <div className="radio__label">
                    <div className={titleClass}>
                        {titles[exclusionsType].title}
                    </div>
                    <div className="radio__description">
                        {titles[exclusionsType].description}
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = (exclusionsType) => {
        const enabled = exclusionsType === currentExclusionsType;

        return (
            <Fragment>
                <Form exclusionsType={exclusionsType} enabled={enabled} />
                <List exclusionsType={exclusionsType} enabled={enabled} />
            </Fragment>
        );
    };

    return (
        <Fragment>
            <div className="settings__section">
                <div className="settings__title">
                    {browser.i18n.getMessage('settings_connection_mode_title')}
                </div>
                <div className="settings__group">
                    <div className="settings__controls">
                        {types.map(type => (
                            <div className="settings__control" key={type}>
                                {renderControls(type)}
                            </div>
                        ))}
                    </div>
                    {types.map(type => (
                        <div className="settings__control" key={type}>
                            {renderContent(type)}
                        </div>
                    ))}
                </div>
            </div>
        </Fragment>
    );
});

export default Mode;
