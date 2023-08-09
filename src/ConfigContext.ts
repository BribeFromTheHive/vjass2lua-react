import React, { useRef } from 'react';
import { useState } from 'react';
import { configModel } from './Components/configurables/config.model.ts';

export const useConfigState = () => {
    const [spacing, setSpacing] = useState(4);
    const [config, setConfig] = useState(configModel);
    const [codeInput, setCodeInput] = useState('');
    const isConverted = useRef(false);
    const prevText = useRef('');
    return {
        spacing,
        setSpacing,
        config,
        setConfig,
        codeInput,
        setCodeInput,
        isConverted,
        prevText,
    };
};

export type ConfigContextType = ReturnType<typeof useConfigState>;

export const ConfigContext = React.createContext<ConfigContextType>(
    null as unknown as ConfigContextType,
);
