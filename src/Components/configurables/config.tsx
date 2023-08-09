import { useContext, useState } from 'react';
import './config.css';
import { configOptionKeys, configOptions } from './config.model.ts';
import { ConfigContext } from '../../ConfigContext.ts';

const Config = () => {
    const { spacing, setSpacing, config, setConfig } =
        useContext(ConfigContext);
    const [isOpen, setIsOpen] = useState(false);

    //config and spacing need to be able to be accessed by the parser function as well as by TextArea.tsx

    return (
        <div className="col-md-4">
            <details
                className={`config-details mt-2 ${
                    isOpen
                        ? 'config-details-expanded'
                        : 'config-details-collapsed'
                }`}
                open={isOpen}
                onToggle={() => setIsOpen(!isOpen)}
            >
                <summary>
                    <span className="config-icon">&#9776;</span> Configurables
                </summary>
                <label className="config-label d-flex align-items-center mt-3">
                    <span className="spacing-text">Spacing:</span>
                    <select
                        value={spacing}
                        onChange={(event) => {
                            setSpacing(Number(event.target.value));
                        }}
                        name="spacing"
                        className="custom-select"
                    >
                        {[2, 3, 4, 6, 8].map((i) => (
                            <option key={i} value={i}>
                                {i}
                            </option>
                        ))}
                    </select>
                </label>
                {configOptionKeys.map((key) => (
                    <label className="form-check mt-2" key={key}>
                        <input
                            type="checkbox"
                            className="form-check-input"
                            checked={config[key]}
                            onChange={() =>
                                setConfig((prevConfig) => ({
                                    ...prevConfig,
                                    [key]: !prevConfig[key],
                                }))
                            }
                        />
                        <div className="form-check-label option-label">
                            {configOptions[key].label}
                        </div>
                    </label>
                ))}
            </details>
        </div>
    );
};

export default Config;
