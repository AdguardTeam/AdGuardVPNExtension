import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import Modal from 'react-modal';

import log from '../../../lib/logger';
import { REQUEST_STATUSES } from '../../stores/consts';

import '../../styles/main.pcss';
import './app.pcss';

import rootStore from '../../stores';
import Sidebar from '../Sidebar';
import Footer from '../Footer';
import Settings from '../Settings';
import Account from '../Account';
import About from '../About';
import Auth from '../Auth';
import Exclusions from '../Exclusions';
import Preloader from '../Preloader';
import Icons from '../ui/Icons';
import messenger from '../../../lib/messenger';
import notifier from '../../../lib/notifier';

Modal.setAppElement('#root');

const getContent = (authenticated, requestProcessState) => {
    if (authenticated) {
        return (
            <div className="container">
                <div className="wrapper">
                    <Sidebar />
                    <div className="content">
                        <Switch>
                            <Route path="/" exact component={Exclusions} />
                            <Route path="/settings" component={Settings} />
                            <Route path="/account" component={Account} />
                            <Route path="/about" component={About} />
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
            <Auth />
        </>
    );
};

const App = observer(() => {
    const {
        authStore,
        settingsStore,
        globalStore,
    } = useContext(rootStore);

    const { status } = globalStore;

    useEffect(() => {
        let removeListenerCallback = () => {};
        (async () => {
            await globalStore.init();

            const events = [
                notifier.types.AUTHENTICATE_SOCIAL_SUCCESS,
                notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE,
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
                            await settingsStore.getExclusions();
                            break;
                        }
                        default: {
                            log.debug('Undefined message type:', type);
                            break;
                        }
                    }
                }
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

    const { authenticated, requestProcessState } = authStore;

    return (
        <HashRouter hashType="noslash">
            {getContent(authenticated, requestProcessState)}
            <Icons />
            <Footer />
        </HashRouter>
    );
});

export default App;
