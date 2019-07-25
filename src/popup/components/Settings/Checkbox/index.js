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
                <label
                    htmlFor={id}
                    className="checkbox__label"
                >
                    {title}
                </label>

                <input
                    type="checkbox"
                    name={id}
                    checked={value}
                    onChange={this.changeHandler}
                    id={id}
                    className="checkbox__in"
                />

            </div>
        );
    }
}

export default Checkbox;
