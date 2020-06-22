import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import rootStore from '../../stores';
import Title from '../ui/Title';
import './about.pcss';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

const About = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const aboutVersionStr = `${reactTranslator.translate('name')} ${settingsStore.appVersion}`;
    return (
        <>
            <Title title={reactTranslator.translate('about_title')} />
            <div className="about">
                <div className="about__version">
                    {aboutVersionStr}
                </div>
                <div className="about__description">
                    {reactTranslator.translate('description')}
                </div>
            </div>
        </>
    );
});

export default About;
