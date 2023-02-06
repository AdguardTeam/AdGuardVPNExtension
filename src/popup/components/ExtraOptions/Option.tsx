import React, { ReactNode } from 'react';

type OptionProps = {
    handler?: () => void,
    text: string | ReactNode,
};

export const Option = ({ handler, text }: OptionProps) => (
    <button
        type="button"
        className="button button--inline extra-options__item"
        onClick={handler}
    >
        {text}
    </button>
);
