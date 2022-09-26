import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import Modal from 'react-modal';

import { log } from '../../../lib/logger';
import { RequestStatus } from '../../stores/consts';
import { rootStore } from '../../stores';
import { Sidebar } from '../Sidebar';
import { Settings } from '../Settings';
import { FreeGbs } from '../FreeGbs';
import { Account } from '../Account';
import { About } from '../About';
import { SignedOut } from '../SignedOut';
import { Preloader } from '../Preloader';
import Icons from '../ui/Icons';
import { messenger } from '../../../lib/messenger';
import { notifier } from '../../../lib/notifier';
import { Support } from '../Support';
import { Notifications } from '../ui/Notifications';
import { useAppearanceTheme } from '../../../common/useAppearanceTheme';
import { Exclusions } from '../Exclusions';

import '../../styles/main.pcss';
import './app.pcss';

Modal.setAppElement('#root');

const getContent = (authenticated, requestProcessState, isPremiumToken) => {
    if (authenticated) {
        return (
            <div className="wrapper">
                <Sidebar />
                <div className="content">
                    <Switch>
                        <Route path="/" exact component={Settings} />
                        <Route path="/exclusions" exact component={Exclusions} />
                        <Route path="/account" component={Account} />
                        <Route path="/about" component={About} />
                        <Route path="/support" component={Support} />
                        {!isPremiumToken && (
                            <Route path="/free-gbs" component={FreeGbs} />
                        )}
                        <Route component={Settings} />
                    </Switch>
                </div>
            </div>
        );
    }

    return (
        <>
            {requestProcessState === RequestStatus.Pending && <Preloader />}
            <SignedOut />
        </>
    );
};

export const App = observer(() => {
    const {
        authStore,
        settingsStore,
        globalStore,
        exclusionsStore,
    } = useContext(rootStore);

    useAppearanceTheme(settingsStore.appearanceTheme);

    const { status } = globalStore;

    const { isPremiumToken } = settingsStore;

    useEffect(() => {
        let removeListenerCallback = () => {};
        (async () => {
            await globalStore.init();

            const events = [
                notifier.types.AUTHENTICATE_SOCIAL_SUCCESS,
                notifier.types.EXCLUSIONS_DATA_UPDATED,
                notifier.types.USER_AUTHENTICATED,
                notifier.types.USER_DEAUTHENTICATED,
            ];

            // Subscribe to notification from background page with this method
            // If use runtime.onMessage, then we can intercept messages from popup
            // to the message handler on background page
            removeListenerCallback = await messenger.createEventListener(
                events,
                async (message) => {
                    const { type } = message;

                    switch (type) {
                        case notifier.types.AUTHENTICATE_SOCIAL_SUCCESS: {
                            authStore.setIsAuthenticated(true);
                            break;
                        }
                        case notifier.types.EXCLUSIONS_DATA_UPDATED: {
                            await exclusionsStore.updateExclusionsData();
                            break;
                        }
                        case notifier.types.USER_AUTHENTICATED: {
                            await globalStore.getOptionsData();
                            await settingsStore.updateCurrentUsername();
                            break;
                        }
                        case notifier.types.USER_DEAUTHENTICATED: {
                            authStore.setIsAuthenticated(false);
                            await settingsStore.updateCurrentUsername();
                            break;
                        }
                        default: {
                            log.debug('Undefined message type:', type);
                            break;
                        }
                    }
                },
            );
        })();

        return () => {
            removeListenerCallback();
        };
    }, []);

    // show nothing while data is loading
    if (status === RequestStatus.Pending) {
        return null;
    }

    const { authenticated, requestProcessState } = authStore;

    return (
        <HashRouter hashType="noslash">
            {getContent(authenticated, requestProcessState, isPremiumToken)}
            <Notifications />
            <Icons />
        </HashRouter>
    );
});
