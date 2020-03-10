import React from 'react';

const Option = ({ handler, text }) => (
    <button
        type="button"
        className="button button--inline extra-options__item"
        onClick={handler}
    >
        {text}
    </button>
);

export default Option;
