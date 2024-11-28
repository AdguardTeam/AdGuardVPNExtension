import React, { useState } from 'react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { translator } from '../../../../common/translator';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

export interface AddSubdomainModalProps {
    open: boolean;
    hostname: string;
    onClose: () => void;
    onSubmit: (subdomain: string) => void;
}

export function AddSubdomainModal({
    open,
    hostname,
    onClose,
    onSubmit,
}: AddSubdomainModalProps) {
    const [inputValue, setInputValue] = useState('');
    const [inputError, setInputError] = useState<string | null>(null);

    const handleClose = () => {
        setInputValue('');
        setInputError(null);
        onClose();
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!inputValue) {
            return;
        }

        if (inputValue.includes(' ')) {
            setInputError(translator.getMessage('settings_exclusion_invalid_subdomain'));
            return;
        }

        onSubmit(inputValue);
        handleClose();
    };

    return (
        <Modal
            title={reactTranslator.getMessage('settings_exclusion_add_subdomain')}
            open={open}
            variant="thin"
            onClose={handleClose}
        >
            <form
                style={{ marginTop: 16 }}
                onSubmit={handleSubmit}
                onReset={handleClose}
            >
                <Input
                    id="subdomain"
                    name="subdomain"
                    label={reactTranslator.getMessage('settings_exclusion_subdomain_name')}
                    placeholder="subdomain"
                    required
                    value={inputValue}
                    error={inputError}
                    postfix={`.${hostname}`}
                    onChange={setInputValue}
                />
                <div className="exclusions__modal-actions">
                    <Button type="reset" variant="outline">
                        {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                    </Button>
                    <Button type="submit" disabled={!inputValue}>
                        {reactTranslator.getMessage('settings_exclusion_add')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
