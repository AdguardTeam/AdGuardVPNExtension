import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import nanoid from 'nanoid';
import rootStore from '../../../../stores';
import './signals-animation.pcss';
import { REQUEST_STATUSES } from '../../../../stores/consts';

const SignalsAnimation = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const proxyIsEnabling = settingsStore.proxyEnablingStatus === REQUEST_STATUSES.PENDING;

    const mapSignalStatus = classnames({
        'signals-animation--active': proxyIsEnabling && !settingsStore.ping,
    });

    const fill = proxyIsEnabling ? 'rgba(0, 76, 51, 0.2)' : 'rgba(50, 50, 50, 0.2)';
    const animationCirclesNumber = 4;

    return (
        <g className={`signals-animation ${mapSignalStatus}`}>
            {
                [...Array(animationCirclesNumber)].map((e, i) => (
                    <circle
                        key={nanoid()}
                        className={`signals-animation__circle-${i}`}
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

export default SignalsAnimation;
