import React, { Fragment, useContext } from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';
import rootStore from '../../stores';

import './about.pcss';

const About = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const aboutVersionStr = `${browser.i18n.getMessage('name')} ${settingsStore.appVersion}`;
    return (
        <Fragment>
            <h2 className="content__title">
                {browser.i18n.getMessage('about_title')}
            </h2>
            <div className="about">
                <div className="about__version">
                    {aboutVersionStr}
                </div>
                <div className="about__description">
                    {browser.i18n.getMessage('description')}
                </div>
            </div>
        </Fragment>
    );
});

export default About;
