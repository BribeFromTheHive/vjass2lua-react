import { useContext } from 'react';
import { ConfigContext } from '../../ConfigContext.ts';
import { transcompile } from '../../parsing-modules/transcompile.ts';
import './buttons.css';

const TopButtonsComponent = () => {
    const context = useContext(ConfigContext);
    const { prevText, isConverted, codeInput, setCodeInput } = context;

    return (
        <div className="button-container">
            {[
                {
                    text: 'Convert to Lua',
                    clickHandler: () => {
                        if (
                            isConverted.current &&
                            /^--Conversion by vJass2Lua/m.test(codeInput)
                        ) {
                            throw new Error('Code already converted!');
                        } else {
                            setCodeInput(transcompile(codeInput, context));
                        }
                    },
                },
                {
                    text: 'Revert to vJass',
                    clickHandler: () => {
                        if (
                            isConverted.current &&
                            prevText.current !== codeInput
                        ) {
                            isConverted.current = false;
                            setCodeInput(prevText.current);
                        }
                    },
                },
                {
                    text: 'Add //! zinc wrapper',
                    clickHandler: () => {
                        setCodeInput(`//! zinc\n${codeInput}\n//! endzinc`);
                    },
                },
                {
                    text: 'Copy to Clipboard',
                    clickHandler: () =>
                        navigator.clipboard
                            .writeText(codeInput)
                            .catch(console.error),
                },
            ].map((control, index) => (
                <button
                    key={index}
                    className="btn btn-primary"
                    onClick={control.clickHandler}
                >
                    {control.text}
                </button>
            ))}
        </div>
    );
};

export default TopButtonsComponent;
