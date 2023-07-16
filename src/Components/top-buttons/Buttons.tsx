import { useContext } from 'react';
import { ConfigContext } from '../../ConfigContext.ts';
import { transcompile } from '../../parsing-modules/transcompile.ts';
import './buttons.css';

const TopButtonsComponent = () => {
    const context = useContext(ConfigContext);
    const { codeInput, setCodeInput } = context;

    let isConverted = false;

    return (
        <div className="button-container">
            {[
                {
                    text: 'Convert to Lua',
                    clickHandler: () => {
                        if (
                            isConverted &&
                            /^--Conversion by vJass2Lua/m.test(codeInput)
                        ) {
                            throw new Error('Code already converted!');
                        } else {
                            isConverted = true;
                            setCodeInput(transcompile(codeInput, context));
                        }
                    },
                },
                {
                    text: 'Revert to vJass',
                    clickHandler: () => {
                        const current =
                            null; /*this needs to read the current textarea value*/
                        const recent =
                            ''; /*this just remembers the last pre-converted textarea value*/
                        if (
                            isConverted /*this is a flag that tracks whether the text is flagged as converted or not*/ &&
                            recent &&
                            recent !== current
                        ) {
                            isConverted = false; //this flag can be set here as well as in the parser function.
                            setCodeInput(recent);
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
