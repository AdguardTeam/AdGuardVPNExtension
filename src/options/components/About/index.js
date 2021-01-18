import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import rootStore from '../../stores';
import { Title } from '../ui/Title';
import { reactTranslator } from '../../../common/reactTranslator';

import './about.pcss';

const About = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const aboutVersionStr = `${reactTranslator.getMessage('name')} ${settingsStore.appVersion}`;
    return (
        <>
            <Title title={reactTranslator.getMessage('about_title')} />
            <div className="about">
                <div className="about__version">
                    {aboutVersionStr}
                </div>
                <div className="about__description">
                    {reactTranslator.getMessage('description')}
                </div>
            </div>
        </>
    );
});

export default About;
