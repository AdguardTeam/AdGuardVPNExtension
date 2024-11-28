import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { HashRouter, Route, Switch } from 'react-router-dom';

import { RequestStatus } from '../stores/consts';
import { rootStore } from '../stores';
import { useAppearanceTheme } from '../../common/useAppearanceTheme';
import { useCustomDnsFromQuery } from '../hooks/useQueryStringData';
import { useMessageHandler } from '../hooks/useMessageHandler';

import { Notifications } from './Notifications';
import { Icons } from './ui/Icon';
import { Preloader } from './Preloader';
import { Sidebar } from './Sidebar';
import { General } from './General';
import { Exclusions } from './Exclusions';
import { Account, AccountSignedOut } from './Account';
import { About } from './About';
import { Support } from './Support';
import { FreeGbs } from './FreeGbs';

import './app.pcss';

const getContent = (
    authenticated: boolean,
    requestProcessState: RequestStatus,
    isPremiumToken: boolean,
) => {
    if (authenticated) {
        return (
            <div className="wrapper">
                <Sidebar />
                <div className="content">
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
            <AccountSignedOut />
        </>
    );
};

export const App = observer(() => {
    const {
        authStore,
        settingsStore,
        globalStore,
    } = useContext(rootStore);

    useMessageHandler();

    useAppearanceTheme(settingsStore.appearanceTheme);

    useCustomDnsFromQuery(settingsStore.handleCustomDnsData);

    const { status } = globalStore;

    const { isPremiumToken } = settingsStore;

    useEffect(() => {
        (async () => {
            await globalStore.init();
        })();
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
