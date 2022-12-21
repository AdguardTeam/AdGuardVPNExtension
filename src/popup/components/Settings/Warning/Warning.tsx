import React from 'react';

import './warning.pcss';

type WarningProps = {
    desc: string | React.ReactNode,
    mod: string,
};

export const Warning = ({ desc, mod }: WarningProps) => {
    return (
        <div className={`warning warning--${mod}`}>
            {desc}
        </div>
    );
};
