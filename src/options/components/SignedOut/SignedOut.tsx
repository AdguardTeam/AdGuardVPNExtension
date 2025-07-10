import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { translator } from '../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import signedOutImageUrl from '../../../assets/images/signed-out.svg';
import { rootStore } from '../../stores';

import './signedout.pcss';

export const SignedOut = observer(() => {
    const { telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.LoggedOutScreen,
    );

    return (
        <div className="signedout">
            <div className="signedout__content">
                <img
                    className="signedout__image"
                    src={signedOutImageUrl}
                    alt="Floating Ninja"
                />
                <div className="signedout__title">
                    {translator.getMessage('options_signedout_page_title')}
                </div>
                <div className="signedout__description">
                    {translator.getMessage('options_signedout_page_description_not_secure')}
                    <br />
                    <br />
                    {translator.getMessage('options_signedout_page_description')}
                </div>
            </div>
        </div>
    );
});
