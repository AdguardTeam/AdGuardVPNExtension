import React from 'react';

import translator from '../../../lib/translator/translator';
import { SUGGEST_FEATURE } from '../../../background/config';

const Title = ({ title }) => (
    <h2 className="content__title">
        {title}

        <a
            href={SUGGEST_FEATURE}
            className="content__link"
            target="_blank"
            rel="noopener noreferrer"
        >
            {translator.translate('suggest_feature')}
        </a>
    </h2>
);

export default Title;
