import { regexJass } from '../regular-expressions/jass-expressions.ts';

export const parsePreLocals = (mainParsedStr: string) =>
    mainParsedStr
        .replace(regexJass.singleCaptureGroup.staticIfs, '$1if')
        .replace(regexJass.noCaptureGroups.exists, '')
        .replace(
            regexJass.namedCaptureGroups.methodCalls,
            (_, firstChar, methodCaller) =>
                `${
                    //Lua doesn't understand an isolated '.' as valid syntax, so we need to input 'self' as a prefix.
                    //This should already be handled by `find.isolatedDots` in parse.classes.ts, but it would need to be
                    //tested to see if just that one covers all use cases for this one as well.
                    firstChar === ' ' ? ' self' : firstChar
                }.${methodCaller}(`
                    //treat all x.method() as x:method() just in case we need to pass x as "self".
                    .replace(regexJass.singleCaptureGroup.lastDotInSeq, ':$1')
        )
        .replace(
            regexJass.namedCaptureGroups.dynamicArrays,
            '$<indent>local $<typeName> = Struct(); $<typeName>.size = $<size> ---@type $<baseType>[]'
        )
        .replace(
            regexJass.namedCaptureGroups.interfaces,
            '$<indent>Struct $<interfaceName> = vJass.interface(true)\n$<indent>--[[$remainder$<indent>]]'
        )
        .replace(
            regexJass.singleCaptureGroup.functionInterfaces,
            '$1---@class'
        );

export const parsePostLocals = (mainParsedStr: string) =>
    mainParsedStr
        .replaceNamed(
            regexJass.namedCaptureGroups.scopedFunctions,
            ({ indent, scopeName, functionName, functionContents }) => {
                if (scopeName === 'public') {
                    functionContents += `\n${indent}_G[SCOPE_PREFIX..'${functionName}'] = ${functionName}`;
                }
                return `${indent}local function ${functionName}${functionContents}`;
            }
        )
        .replace(regexJass.singleCaptureGroup.vJassKeyword, '$1local')
        .replace(
            regexJass.namedCaptureGroups.hooks,
            '$<indent>vJass.hook("$<nativeName>", $<proxyFuncName>)'
        );
