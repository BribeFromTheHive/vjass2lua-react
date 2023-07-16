import React from 'react';
import { useState } from 'react';
import { configModel } from './Components/configurables/config.model.ts';

export const useConfigState = () => {
    const [spacing, setSpacing] = useState(4);
    const [config, setConfig] = useState(configModel);
    const [codeInput, setCodeInput] = useState('');
    return {
        spacing,
        setSpacing,
        config,
        setConfig,
        codeInput,
        setCodeInput,
    };
};

export type ConfigContextType = ReturnType<typeof useConfigState>;

export const ConfigContext = React.createContext<ConfigContextType>(
    null as unknown as ConfigContextType,
);
