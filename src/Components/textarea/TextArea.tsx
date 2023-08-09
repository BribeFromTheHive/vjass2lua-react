import { useContext } from 'react';
import { transcompile } from '../../parsing-modules/transcompile.ts';
import { ConfigContext } from '../../ConfigContext.ts';
import MonacoEditor from '@monaco-editor/react';
import { setupJass } from 'monaco-jass-highlighter';

setupJass('/node_modules/onigasm/lib/onigasm.wasm').catch(console.error);

const options = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
} as const;

const EditorComponent = () => {
    const context = useContext(ConfigContext);

    return (
        <MonacoEditor
            width="100%"
            height="400px"
            language="jass"
            theme="vs-dark"
            value={context.codeInput}
            options={options}
            onMount={(editor) => {
                editor.onDidPaste(async () => {
                    const clipboardData = await navigator.clipboard.readText();
                    const transpiledCode = transcompile(clipboardData, context);

                    const range = editor.getModel()?.getFullModelRange();
                    if (!range) {
                        throw new Error('Range not defined for editor?');
                    }

                    // Replace the content of the editor with the transpiled code
                    editor.executeEdits('', [
                        {
                            range,
                            text: transpiledCode,
                        },
                    ]);

                    // Update context with the transpiled code
                    context.setCodeInput(transpiledCode);
                });

                editor.onDidChangeModelContent(() => {
                    context.setCodeInput(editor.getValue());
                });
            }}
        />
    );
};

export default EditorComponent;
