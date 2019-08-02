import React from 'react';
import './endpoint.pcss';

function Endpoint(props) {
    const { handle, status } = props;
    return (
        <div className="endpoint">
            <button
                type="button"
                className="button endpoint__btn"
                onClick={handle}
            >
                Germany
            </button>
            <div className="endpoint__status">
                {status}
            </div>
        </div>
    );
}

export default Endpoint;
