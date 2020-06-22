import React from 'react';

import { SUGGEST_FEATURE } from '../../../background/config';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

const Title = ({ title }) => (
    <h2 className="content__title">
        {title}

        <a
            href={SUGGEST_FEATURE}
            className="content__link"
            target="_blank"
            rel="noopener noreferrer"
        >
            {reactTranslator.translate('suggest_feature')}
        </a>
    </h2>
);

export default Title;
