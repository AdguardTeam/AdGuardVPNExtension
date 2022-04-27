import React from 'react';

import { DotsLoader } from '../../../common/components/DotsLoader';

const Submit = ({
    processing, disabled, text,
}) => {
    if (processing) {
        return <DotsLoader />;
    }

    return (
        <button
            type="submit"
            className="button button--medium button--green form__btn"
            disabled={disabled}
        >
            {text}
        </button>
    );
};

export default Submit;
