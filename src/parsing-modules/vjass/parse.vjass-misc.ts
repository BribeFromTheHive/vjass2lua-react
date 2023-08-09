export const rawVariable = '[$]?\\b[A-Za-z][\\w]*\\b[$]?' as const,
    captureVariable = `(${rawVariable})` as const; //captures a vJass variable name to a group.

const find = {
    staticIfs: /^( *)static +if\b/gm, //static-if is a vJass compile-time optimization, which Lua doesn't have.
    exists: /[.]exists\b/g, //This vJass feature is the same as simply reading the variable in Lua.
    methodCalls: /(.)[.]([$\w.]+) *[(]/gm,
    lastDotInSeq: /\.([^.]*$)/,
    dynamicArrays:
        /^( *)(?:private|public)* *type +(\w+) +extends +(\w+) +array *\[ *(\d+) *]/g,
    interfaces: /^( *)interface\b +([$\w]+)(.*?)^ *endinterface/gm,
    functionInterfaces: /^( *)(?:public|private)? *function interface/gm,
    scopedFunctions:
        /^( *)(private|public +)(?:constant +)?function +([$\w]+)(.+?^ *endfunction)/gms,
    keywords: /^( *)(?:public|private) +keyword\b/gm,
    hooks: /^( *)hook +(\w+) +([\w.]+)/gm,
} as const;

export const parsePreLocals = (mainParsedStr: string) =>
    mainParsedStr
        .replace(find.staticIfs, '$1if')
        .replace(find.exists, '')
        .replace(find.methodCalls, (_, firstChar, methodCaller) =>
            `${
                //Lua doesn't understand an isolated '.' as valid syntax, so we need to input 'self' as a prefix.
                //This should already be handled by `find.isolatedDots` in parse.classes.ts, but it would need to be
                //tested to see if just that one covers all use cases for this one as well.
                firstChar === ' ' ? ' self' : firstChar
            }.${methodCaller}(`
                //treat all x.method() as x:method() just in case we need to pass x as "self".
                .replace(find.lastDotInSeq, ':$1'),
        )
        .replace(
            find.dynamicArrays,
            '$1local $2 = Struct(); $2.size = $4 ---@type $3[]',
        )
        .replace(
            find.interfaces,
            '$1Struct $2 = vJass.interface(true)\n$1--[[$3$1]]',
        )
        .replace(find.functionInterfaces, '$1---@class');

export const parsePostLocals = (mainParsedStr: string) =>
    mainParsedStr
        .replace(find.scopedFunctions, (_, indent, scope, name, body) => {
            if (scope === 'public') {
                body += `\n${indent}_G[SCOPE_PREFIX..'${name}'] = ${name}`;
            }
            return `${indent}local function ${name}${body}`;
        })
        .replace(find.keywords, '$1local')
        .replace(find.hooks, '$1vJass.hook("$2", $3)');
