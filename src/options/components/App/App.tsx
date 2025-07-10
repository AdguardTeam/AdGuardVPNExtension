import React, { useContext, useEffect, useLayoutEffect } from 'react';
import { observer } from 'mobx-react';
import { HashRouter, Route, Switch } from 'react-router-dom';

import { useAppearanceTheme } from '../../../common/useAppearanceTheme';
import { Icons } from '../../../common/components/Icons';
import { rootStore } from '../../stores';
import { RequestStatus } from '../../stores/consts';
import { useCustomDnsFromQuery } from '../../hooks/useQueryStringData';
import { useMessageHandler } from '../../hooks/useMessageHandler';
import { Notifications } from '../ui/Notifications';
import { Preloader } from '../Preloader';
import { SignedOut } from '../SignedOut';
import { Sidebar } from '../Sidebar';
import { General } from '../General';
import { Exclusions } from '../Exclusions';
import { Account } from '../Account';
import { Support } from '../Support';
import { About } from '../About';
import { FreeGbs } from '../FreeGbs';

import '../../styles/main.pcss';
import './app.pcss';

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
                            <Route path="/" exact component={General} />
                            <Route path="/exclusions" exact component={Exclusions} />
                            <Route path="/account" component={Account} />
                            <Route path="/about" component={About} />
                            <Route path="/support" component={Support} />
                            {!isPremiumToken && (
                                <Route path="/free-gbs" component={FreeGbs} />
                            )}
                            <Route component={General} />
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
        telemetryStore,
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

        const onUnload = () => {
            telemetryStore.removeOpenedPage();
        };

        window.addEventListener('beforeunload', onUnload);

        return () => {
            onUnload();
            window.removeEventListener('beforeunload', onUnload);
        };
    }, []);

    /**
     * We are adding locked class to body in order to lock scrolling in case
     * if any modal, sidebar is open. We are adding specifically to body because
     * in Apple devices "spring scroll" is not works if we add locking to div elements.
     */
    useLayoutEffect(() => {
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
