import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { Permissions } from '../../../common/permissions';
import { reactTranslator } from '../../../common/reactTranslator';
import { getPrivacyAndEulaUrls } from '../../../common/forwarderHelpers';
import { rootStore } from '../../stores';
import { navActions } from '../../../common/actions/navActions';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';

import './host-permissions-error.pcss';

/**
 * This component presents an error if host permissions are not granted for <all_urls>.
 *
 * Granting permissions is required for the extension to work properly
 * because otherwise it won't be able to make api requests.
 */
export const HostPermissionsError = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    const { isHostPermissionsGranted, forwarderDomain } = settingsStore;

    const { privacyUrl } = getPrivacyAndEulaUrls(forwarderDomain);

    const isOpen = !isHostPermissionsGranted;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogAccessWebsitesPermission,
        isOpen,
    );

    const handleAllow = (): void => {
        // the method is async but we don't need to wait for it
        // to avoid the permission request popup shown over the VPN popup
        Permissions.addNeededHostPermissions();
        window.close();
    };

    const handlePrivacyClick = async (e: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
        e.preventDefault();
        await navActions.openTab(privacyUrl);
    };

    const hostPermissionsInfo = reactTranslator.getMessage(
        'popup_host_permission_error_info',
        {
            privacy: (chunks: string) => (
                <a
                    onClick={handlePrivacyClick}
                    className="button button--link-green"
                >
                    {chunks}
                </a>
            ),
        },
    );

    return (
        <Modal
            isOpen={isOpen}
            className="modal host-permissions-error"
            shouldCloseOnOverlayClick
            overlayClassName="modal__overlay"
        >
            <div className="host-permissions-error__image host-permissions-error__image" />
            <div className="modal__title host-permissions-error__title">
                {reactTranslator.getMessage('popup_host_permission_error_title')}
            </div>
            <div className="host-permissions-error__info">
                {hostPermissionsInfo}
            </div>
            <button
                type="button"
                className="button button--medium button--medium--wide button--green host-permissions-error__button"
                onClick={handleAllow}
            >
                {reactTranslator.getMessage('popup_host_permission_error_btn_allow')}
            </button>
        </Modal>
    );
});
