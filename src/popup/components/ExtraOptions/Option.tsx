import React, { type ReactElement, type ReactNode } from 'react';

import classnames from 'classnames';

type OptionProps = {
    handler: () => void,
    text: string | ReactNode,
    addClassName: string | null,
};

export const Option = ({ handler, text, addClassName }: OptionProps): ReactElement => {
    const optionClasses = classnames(
        'button button--inline extra-options__item',
        { [`${addClassName}`]: !!addClassName },
    );

    return (
        <button
            type="button"
            className={optionClasses}
            onClick={handler}
        >
            {text}
        </button>
    );
};
