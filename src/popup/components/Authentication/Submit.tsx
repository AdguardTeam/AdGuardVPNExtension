import React, { ReactNode } from 'react';

import { DotsLoader } from '../../../common/components/DotsLoader';

type SubmitProps = {
    processing: boolean,
    disabled?: boolean,
    text: string | ReactNode,
};

export const Submit = ({
    processing, disabled, text,
}: SubmitProps) => {
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
