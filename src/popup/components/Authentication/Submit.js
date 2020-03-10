import React from 'react';

import DotsLoader from '../ui/DotsLoader';

function Submit({
    processing, disabled, text,
}) {
    if (processing) {
        return <DotsLoader />;
    }

    return (
        <button
            type="submit"
            className="button button--medium button--green-gradient form__btn"
            disabled={disabled}
        >
            {text}
        </button>
    );
}

export default Submit;
