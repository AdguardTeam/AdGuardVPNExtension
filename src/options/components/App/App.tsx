import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import Modal from 'react-modal';

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
import { Support } from '../Support';
import { Notifications } from '../ui/Notifications';
import { useAppearanceTheme } from '../../../common/useAppearanceTheme';
import { Exclusions } from '../Exclusions';
import { useCustomDnsFromQuery } from '../../hooks/useQueryStringData';

import { useMessageHandler } from './useMessageHandler';

import '../../styles/main.pcss';
import './app.pcss';

Modal.setAppElement('#root');

const getContent = (
    authenticated: boolean,
    requestProcessState: RequestStatus,
    isPremiumToken: boolean,
    isContentLocked: boolean,
) => {
    if (authenticated) {
        return (
            <div className="wrapper">
                <Sidebar />
                <div className="content" inert={isContentLocked ? '' : undefined}>
                    <div className="content__wrapper">
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
        uiStore,
    } = useContext(rootStore);

    useMessageHandler();

    useAppearanceTheme(settingsStore.appearanceTheme);

    useCustomDnsFromQuery(settingsStore.handleCustomDnsData);

    const { status } = globalStore;

    const { isPremiumToken } = settingsStore;

    const { isContentLocked } = uiStore;

    useEffect(() => {
        (async () => {
            await globalStore.init();
        })();
    }, []);

    /**
     * We are adding locked class to body in order to lock scrolling in case
     * if any modal, sidebar is open. We are adding specifically to body because
     * in Apple devices "spring scroll" is not works if we add locking to div elements.
     */
    useEffect(() => {
        const BODY_LOCK_CLASS = 'locked';

        if (isContentLocked) {
            document.body.classList.add(BODY_LOCK_CLASS);
        } else {
            document.body.classList.remove(BODY_LOCK_CLASS);
        }

        return () => {
            document.body.classList.remove(BODY_LOCK_CLASS);
        };
    }, [isContentLocked]);

    // show nothing while data is loading
    if (status === RequestStatus.Pending) {
        return null;
    }

    const { authenticated, requestProcessState } = authStore;

    return (
        <HashRouter hashType="noslash">
            {getContent(authenticated, requestProcessState, isPremiumToken, isContentLocked)}
            <Notifications />
            <Icons />
        </HashRouter>
    );
});
