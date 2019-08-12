import React, { Component } from 'react';
import './endpoint.pcss';
import { observer } from 'mobx-react';
import { mapStore } from '../../../stores';

@observer
class CurrentEndpoint extends Component {
    render() {
        // TODO [maximtop] consider default city name
        const selectedEndpoint = (mapStore.selectedEndpoint && mapStore.selectedEndpoint.cityName) || 'default city';
        const { handle, status } = this.props;
        return (
            <div className="endpoint">
                <button
                    type="button"
                    className="button endpoint__btn"
                    onClick={handle}
                >
                    {selectedEndpoint}
                </button>
                <div className="endpoint__status">
                    {status}
                </div>
            </div>
        );
    }
}

export default CurrentEndpoint;
