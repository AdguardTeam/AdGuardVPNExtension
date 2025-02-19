import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { getForwarderUrl } from '../../../common/helpers';
import { translator } from '../../../common/translator';
import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { TelemetryScreenName } from '../../../background/telemetry';
import { COMPLETE_TASK_BONUS_GB } from '../../stores/consts';
import { rootStore } from '../../stores';
import { Icon } from '../ui/Icon';
import { Title } from '../ui/Title';
import { Button } from '../ui/Button';

export const AddDevice = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.FreeGbAddAnotherPlatformScreen,
    );

    const { multiplatformBonus, forwarderDomain } = settingsStore;

    const otherProductsUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.OTHER_PRODUCTS);
    const isCompleted = !multiplatformBonus.available;

    const title = isCompleted
        ? translator.getMessage('settings_free_gbs_devices_added_title')
        : translator.getMessage('settings_free_gbs_add_device_title');

    const description = isCompleted
        ? translator.getMessage('settings_free_gbs_devices_added_info')
        : translator.getMessage('settings_free_gbs_add_device_info', { your_gb: COMPLETE_TASK_BONUS_GB });

    return (
        <div className="free-gbs-task">
            <Title title="" onClick={goBackHandler} />
            <img
                src="../../../assets/images/add-device.svg"
                alt={title}
                className="free-gbs-task__image"
            />
            <Title
                title={title}
                subtitle={description}
                className="free-gbs-task__title"
            />
            <div className="free-gbs-task__content add-device">
                {!isCompleted ? (
                    <>
                        <img
                            src="../../../assets/images/products.svg"
                            className="add-device__products"
                            alt="products"
                        />
                        <div className="add-device__button-wrapper">
                            <a
                                href={otherProductsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="button button--filled button--size-medium add-device__link"
                            >
                                <Icon name="external-link" className="add-device__link-icon" />
                                <span className="text-ellipsis">
                                    {translator.getMessage('settings_free_gbs_add_device_products_button')}
                                </span>
                            </a>
                        </div>
                    </>
                ) : (
                    <Button
                        variant="outlined"
                        size="medium"
                        onClick={goBackHandler}
                        className="free-gbs-task__go-back-btn"
                    >
                        {translator.getMessage('settings_free_gbs_go_back')}
                    </Button>
                )}
            </div>
        </div>
    );
});
