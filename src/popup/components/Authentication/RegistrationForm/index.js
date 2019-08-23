import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import ReactHtmlParser from 'react-html-parser';
import rootStore from '../../../stores';

const RegistrationForm = observer(() => {
    const { authStore } = useContext(rootStore);
    const submitHandler = async (e) => {
        e.preventDefault();
        await authStore.register();
    };

    const inputChangeHandler = (e) => {
        const { target: { name, value } } = e;
        authStore.onCredentialsChange(name, value);
    };


    return (
        <form
            className="form"
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <div className={`form__item${authStore.error && (authStore.field === 'username' || authStore.field === '') ? ' form__item--error' : ''}`}>
                    <label className="form__label" htmlFor="username">
                        Email:
                    </label>
                    <input
                        id="username"
                        className="form__input"
                        type="text"
                        name="username"
                        placeholder="example@mail.com"
                        value={authStore.credentials.username}
                        onChange={inputChangeHandler}
                    />
                </div>
                <div className={`form__item${authStore.error && authStore.field === 'password' ? ' form__item--error' : ''}`}>
                    <div className="form__item-header">
                        <label className="form__label" htmlFor="password">
                            Password:
                        </label>
                    </div>
                    <input
                        id="password"
                        className="form__input"
                        type="password"
                        name="password"
                        onChange={inputChangeHandler}
                        value={authStore.credentials.password}
                    />
                </div>
                <div className="form__item">
                    <div className="form__item-header">
                        <label className="form__label" htmlFor="password_again">
                            Password again:
                        </label>
                    </div>
                    <input
                        id="password_again"
                        className="form__input"
                        type="password"
                        name="password_again"
                        onChange={inputChangeHandler}
                        value={authStore.credentials.password_again}
                    />
                </div>
                { authStore.error
                && (
                <div className="form__item-error">
                    { ReactHtmlParser(authStore.errorDescription) }
                </div>
                )}
            </div>

            <div className="form__btns">
                <button
                    className="form__btn button--uppercase button button--m button--hundred button--green"
                    type="submit"
                >
                        Register
                </button>
            </div>
        </form>
    );
});

export default RegistrationForm;
