import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import translator from '../../../lib/translator';
import rootStore from '../../stores';
import Title from '../ui/Title';
import './about.pcss';

const About = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const aboutVersionStr = `${translator.translate('name')} ${settingsStore.appVersion}`;
    return (
        <>
            <Title title={translator.translate('about_title')} />
            <div className="about">
                <div className="about__version">
                    {aboutVersionStr}
                </div>
                <div className="about__description">
                    {translator.translate('description')}
                </div>
            </div>
        </>
    );
});

export default About;
