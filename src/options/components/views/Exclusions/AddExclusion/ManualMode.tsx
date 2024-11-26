import React, { useState } from 'react';

import { reactTranslator } from '../../../../../common/reactTranslator';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';

export interface ManualModeProps {
    onSubmit: (domain: string) => void;
    onClose: () => void;
}

export function ManualMode({ onSubmit, onClose }: ManualModeProps) {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(inputValue.trim());
    };

    return (
        <form
            className="manual-mode"
            onSubmit={handleSubmit}
            onReset={onClose}
        >
            <div className="manual-mode__content">
                <Input
                    id="domain"
                    name="domain"
                    label={reactTranslator.getMessage('settings_exclusion_domain_name')}
                    placeholder="example.org"
                    required
                    value={inputValue}
                    onChange={setInputValue}
                />
            </div>
            <div className="exclusions__modal-actions">
                <Button type="reset" variant="outline">
                    {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                </Button>
                <Button type="submit">
                    {reactTranslator.getMessage('settings_exclusion_add_manually_add')}
                </Button>
            </div>
        </form>
    );
}
