import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import Modal from 'react-modal';

import { log } from '../../../lib/logger';
import { REQUEST_STATUSES } from '../../stores/consts';

import '../../styles/main.pcss';
import './app.pcss';

import { rootStore } from '../../stores';
import { Sidebar } from '../Sidebar';
import { Footer } from '../Footer';
import { Settings } from '../Settings';
import { Referral } from '../Referral';
import { Account } from '../Account';
import { About } from '../About';
import { SignedOut } from '../SignedOut';
import Exclusions from '../Exclusions';
import { Preloader } from '../Preloader';
import Icons from '../ui/Icons';
import messenger from '../../../lib/messenger';
import notifier from '../../../lib/notifier';
import { Support } from '../Support';
import { Notifications } from '../ui/Notifications';
import { useAppearanceTheme } from '../../../common/useAppearanceTheme';

Modal.setAppElement('#root');

const getContent = (authenticated, requestProcessState, isPremiumToken) => {
    if (authenticated) {
        return (
            <div className="container">
                <div className="wrapper">
                    <Sidebar />
                    <div className="content">
                        <Switch>
                            <Route path="/" exact component={Exclusions} />
                            <Route path="/settings" component={Settings} />
                            {!isPremiumToken && (
                                <Route path="/referral-program" component={Referral} />
                            )}
                            <Route path="/account" component={Account} />
                            <Route path="/about" component={About} />
                            <Route path="/support" component={Support} />
                            <Route component={Settings} />
                        </Switch>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {requestProcessState === REQUEST_STATUSES.PENDING && <Preloader />}
            <SignedOut />
        </>
    );
};

export const App = observer(() => {
    const {
        authStore,
        settingsStore,
        globalStore,
    } = useContext(rootStore);

    useAppearanceTheme(settingsStore.appearanceTheme);

    const { status } = globalStore;

    useEffect(() => {
        let removeListenerCallback = () => {};
        (async () => {
            await globalStore.init();

            const events = [
                notifier.types.AUTHENTICATE_SOCIAL_SUCCESS,
                notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE,
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
                        case notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE: {
                            if (settingsStore.isAddingExclusions) {
                                return;
                            }
                            await settingsStore.getExclusions();
                            break;
                        }
                        case notifier.types.USER_AUTHENTICATED: {
                            await authStore.requestIsPremiumToken();
                            authStore.setIsAuthenticated(true);
                            break;
                        }
                        case notifier.types.USER_DEAUTHENTICATED: {
                            authStore.setIsAuthenticated(false);
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
    if (status === REQUEST_STATUSES.PENDING) {
        return null;
    }

    const { authenticated, requestProcessState, isPremiumToken } = authStore;

    return (
        <HashRouter hashType="noslash">
            {getContent(authenticated, requestProcessState, isPremiumToken)}
            <Notifications />
            <Icons />
            <Footer />
        </HashRouter>
    );
});
