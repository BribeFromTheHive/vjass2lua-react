import { seekLineBreakR } from '../parseHelpers.ts';

const find = {
    textMacros: /^( *)--! *textmacro +(\w+)(.*?)^ *--! *endtextmacro/gms,
    runTextMacros: /^( *)--! *runtextmacro +(?:optional)* *(\w+) *\((.*?)\)/gm,
    takes: /^ takes *(.*)/m,
};

export const parseTextmacros = (mainParsedStr: string) =>
    mainParsedStr
        .replace(
            find.textMacros,
            (_, indent: string, name: string, body: string) => {
                let statements = body.replace(find.takes, '$1');
                if (statements !== body) {
                    const linebreak = statements.search(seekLineBreakR);

                    body = statements;
                    statements = statements.substring(0, linebreak);
                    body = body.substring(linebreak);

                    statements = statements.replace(
                        /\b\w+\b/g,
                        (arg) => `"${arg}"`,
                    );

                    return `${indent}vJass.textmacro("${name}", {${statements}}, [[${body}${indent}]])`;
                }
                return `${indent}vJass.textmacro("${name}", nil, function(thistype)${body}${indent}end)`;
            },
        )
        .replace(
            find.runTextMacros,
            (_, indent: string, name: string, args = '') => {
                if (args) {
                    args = `, ${args}`;
                }
                return `${indent}vJass.runtextmacro("${name}${args}")`;
            },
        );
