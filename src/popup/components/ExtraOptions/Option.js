import React from 'react';

const Option = function ({ handler, text }) {
    return (
        <button
            type="button"
            className="button button--inline extra-options__item"
            onClick={handler}
        >
            {text}
        </button>
    );
};

export default Option;
