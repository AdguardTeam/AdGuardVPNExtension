import React, { Component } from 'react';
import './checkbox.pcss';

class Checkbox extends Component {
    changeHandler = (e) => {
        console.log(e);
    };

    render() {
        const { setting: { title, id, value } } = this.props;
        return (
            <div
                className="checkbox"
            >
                <input
                    type="checkbox"
                    name={id}
                    checked={value}
                    onChange={this.changeHandler}
                    id={id}
                    className="checkbox__in"
                />
                <label
                    htmlFor={id}
                    className="checkbox__label"
                >
                    {title}
                </label>

            </div>
        );
    }
}

export default Checkbox;
