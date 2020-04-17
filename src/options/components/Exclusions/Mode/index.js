import React, { useContext } from 'react';
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

    const onChange = (type) => async () => {
        await toggleInverted(type);
    };

    const modes = [
        adguard.exclusions.MODES.REGULAR,
        adguard.exclusions.MODES.SELECTIVE,
    ];

    const titles = {
        [adguard.exclusions.MODES.REGULAR]: {
            title: browser.i18n.getMessage('settings_exclusion_regular_title'),
            description: browser.i18n.getMessage('settings_exclusion_regular_description'),
        },
        [adguard.exclusions.MODES.SELECTIVE]: {
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
            <>
                <Form exclusionsType={exclusionsType} enabled={enabled} />
                <List exclusionsType={exclusionsType} enabled={enabled} />
            </>
        );
    };

    return (
        <>
            <div className="settings__section">
                <div className="settings__title">
                    {browser.i18n.getMessage('settings_connection_mode_title')}
                </div>
                <div className="settings__group">
                    <div className="settings__controls">
                        {modes.map((type) => (
                            <div className="settings__control" key={type}>
                                {renderControls(type)}
                            </div>
                        ))}
                    </div>
                    {modes.map((type) => (
                        <div className="settings__control" key={type}>
                            {renderContent(type)}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
});

export default Mode;
