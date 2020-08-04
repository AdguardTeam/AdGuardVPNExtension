import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import rootStore from '../../../stores';

import StatusImage from '../StatusImage';
import Status from '../Status';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import SiteInfo from '../SiteInfo';

const ExclusionsDisable = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { isExcluded, exclusionsInverted } = settingsStore;

    const removeFromExclusions = async () => {
        await settingsStore.removeFromExclusions();
    };

    const addToExclusions = async () => {
        await settingsStore.addToExclusions();
    };

    const renderExclusionButton = (isExcluded, exclusionsInverted) => {
        const texts = {
            enable: reactTranslator.translate('popup_settings_enable_vpn_short'),
            disable: reactTranslator.translate('popup_settings_disable_vpn_short'),
        };

        const getText = (enable) => {
            if (enable) {
                return texts.enable;
            }
            return texts.disable;
        };

        const buttonsInfo = {
            add: {
                text: getText(exclusionsInverted),
                handler: addToExclusions,
            },
            remove: {
                text: getText(!exclusionsInverted),
                handler: removeFromExclusions,
            },
        };

        const button = isExcluded ? buttonsInfo.remove : buttonsInfo.add;

        return (
            <button
                onClick={button.handler}
                type="button"
                className="button button--medium button--green"
            >
                {button.text}
            </button>
        );
    };

    return (
        <div className="settings settings--exclusions-disable">
            <div className="settings__main">
                <>
                    <StatusImage />
                    <Status />
                    {renderExclusionButton(isExcluded, exclusionsInverted)}
                    <SiteInfo />
                </>
            </div>
        </div>
    );
});

export default ExclusionsDisable;
