import React, { Component } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import { uiStore, endpointsStore } from '../../stores';
import './endpoints.pcss';

@observer
class Endpoints extends Component {
    handleEndpointSelect = id => async (e) => {
        e.preventDefault();
        await endpointsStore.setSelectedEndpoint(id);
        uiStore.closeEndpointsSearch();
    };

    handleCloseEndpoints = () => {
        uiStore.closeEndpointsSearch();
        endpointsStore.setSearchValue('');
    };

    renderEndpoints = endpoints => endpoints.map((endpoint) => {
        const { cityName, id, selected } = endpoint;
        const endpointClassNames = classnames({
            'endpoints__item--selected': selected,
        });
        return (
            <div
                key={id}
                className={`endpoints__item ${endpointClassNames}`}
                onClick={this.handleEndpointSelect(id)}
            >
                <div className="endpoints__item-ico" />
                <div className="endpoints__city">
                    {cityName}
                </div>
            </div>
        );
    });

    handleSearchInput = (e) => {
        const { value } = e.target;
        endpointsStore.setSearchValue(value);
    };

    render() {
        const endpoints = endpointsStore.filteredEndpoints;
        const endpointsCrossClassNames = classnames({
            'endpoints__cross--active': endpointsStore.searchValue.length > 0,
        });
        return (
            <div className="endpoints">
                <div className="endpoints__header">
                    <button
                        type="button"
                        className="button endpoints__back"
                        onClick={this.handleCloseEndpoints}
                    />
                    <div className="endpoints__search">
                        <input
                            className="endpoints__search-in"
                            type="text"
                            value={endpointsStore.searchValue}
                            onChange={this.handleSearchInput}
                        />
                        <button
                            onClick={() => {
                                endpointsStore.setSearchValue('');
                            }}
                            type="button"
                            className={`button endpoints__cross ${endpointsCrossClassNames}`}
                        />
                    </div>
                </div>
                <div className="endpoints__list">
                    {this.renderEndpoints(endpoints)}
                </div>
            </div>
        );
    }
}

export default Endpoints;
