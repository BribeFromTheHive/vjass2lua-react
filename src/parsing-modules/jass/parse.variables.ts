import { parseVariable } from './parse.variable.ts';

const identifiedIntegers = new Map();

export const isVarInt = (varName: string) => identifiedIntegers.has(varName),
    addToIntStack = (varName: string) => identifiedIntegers.set(varName, true);

export const parseVariables = (variables: string) =>
    variables
        .replace(
            /^( *local +)(.*)/gm,
            (_, local, line) => local + parseVariable(line, true),
        )
        .replace(
            //parse scoped functions.
            /^( *)(private|public)(?: +constant)?\b +function *([$\w]+)(.*?^ *endfunction)/gms,
            (_, indent, scope, name, body) => {
                body = indent + 'local function ' + name + body;
                if (scope === 'public') {
                    return `${body}\n${indent}_G[SCOPE_PREFIX..'${name}'] = ${name}`;
                }
                return body;
            },
        )
        .replace(/^( *)private +keyword\b/gm, '$1local')
        .replace(
            /\$([0-9a-fA-F]+[^$])/g, //JASS "$hexcode" must be converted to "0xhexcode" to work in Lua.
            '0x$1',
        )
        .replace(
            /^( *)hook +(\w+) +(\w*(?:\.\w+)*)/gm,
            "$1vJass.hook('$2', $3)",
        );
