import React, { ReactNode } from 'react';

type OptionArguments = {
    handler: () => void,
    text: string | ReactNode,
};

export const Option = ({ handler, text }: OptionArguments) => (
    <button
        type="button"
        className="button button--inline extra-options__item"
        onClick={handler}
    >
        {text}
    </button>
);
