import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import rootStore from '../../../stores';

import './presentation.pcss';
import { formatBytes } from '../../../../lib/helpers';

const Presentation = observer(() => {
    const { vpnStore } = useContext(rootStore);

    const {
        freeTrafficBytes,
        freeLocationsCount,
    } = vpnStore.presentationInfo;

    const { value, unit } = formatBytes(freeTrafficBytes, 0);

    return (
        <div className="presentation">
            <div className="presentation__in">
                <div className="presentation__title">
                    {reactTranslator.translate('presentation_title', {
                        value,
                        unit,
                    })}
                </div>
                <div className="presentation__desc">
                    {reactTranslator.translate('presentation_desc', {
                        locations_count: freeLocationsCount,
                    })}
                </div>
            </div>
        </div>
    );
});

export default Presentation;
