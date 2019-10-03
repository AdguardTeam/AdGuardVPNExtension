import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import nanoid from 'nanoid';
import rootStore from '../../../../stores';
import './signals-animation.pcss';

const index = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const mapSignalStatus = classnames({
        'signals-animation--active': settingsStore.extensionEnabled && !settingsStore.ping,
    });

    const fill = settingsStore.extensionEnabled ? 'rgba(0, 76, 51, 0.2)' : 'rgba(50, 50, 50, 0.2)';
    const animationCirclesNumber = 4;

    return (
        <g className={`signals-animation ${mapSignalStatus}`}>
            {
                [...Array(animationCirclesNumber)].map((e, i) => (
                    <circle
                        key={nanoid()}
                        className={`signals-animation__marker-${i}`}
                        cx={0}
                        cy={0}
                        r={0}
                        fill={fill}
                    />
                ))
            }
        </g>
    );
});

export default index;
