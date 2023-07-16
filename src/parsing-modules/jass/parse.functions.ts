import { convertJASSTypeToLua, getArgPairs } from '../parseHelpers.ts';
import { isVarInt } from './parse.variables';
import { ConfigModel } from '../../Components/configurables/config.model.ts';

const find = {
    floorInt: /[^/]\/[^/]/g,
    execEval:
        /(?<name>[\w$.]+)[:.](?<reference>name|(?:execute|evaluate))\b *(?<hasArgs>[(](?<args>[^()]*)[)])?/g,
    customType:
        /^(?<indent> *)(?:(?<scope>private|public) +)?type +(<?typeName>[\w$]+)(?<gap> +)extends(?<remainder>.*)/gm,
    functionKeyword: /\bfunction\b/,
    array: /^[^[]*\[ *([^,\] ]+)[^•\r\n]*(.*)/m,
    fullFunction:
        /^(?<indent> *)(?<func>(?:[\w$:[\]=]+ +)+?|[^\r\n]*?\bfunction )\btakes +(?<params>[$\w, ]+ +)+?\breturns +(?<rtype>[$\w]+)(?<contents>.+?\bend)function\b/gms,
    functionRef: /function *([$\w]+(?:[.][\w$]+)? *[),])/g, //remove JASS code type reference (function foo => foo).
    returnLine: /return.+\/.+/g,
    variableAssignment: /([$\w]+) *=[^=\n\r•][^\n\r•]*/g,
    nothing: /\bnothing\b/,
    endFunction: /endfunction/g,
} as const;

export const parseFunctions = (functions: string, config: ConfigModel) => {
    //Fix vJass dynamic function calling/referencing.
    functions = functions
        .replaceNamed(
            find.execEval,
            ({ name, reference, hasArgs, args = '' }, ignoreMatch) => {
                if (!reference || !name) {
                    throw new Error('Regex Failed');
                }
                return name === 'vJass'
                    ? ignoreMatch //ignore stuff that was already parsed.
                    : reference === 'name'
                    ? 'vJass.name(' + name + ')' //This adds the function to the _G table and returns the string indicating where it is.
                    : !hasArgs
                    ? ignoreMatch //ExecuteFunc will ignore strings that are not pointing to functions stored in the _G table.
                    : `vJass.${reference}(${name}, ${args})`; //myFunction.execute(1, 10) becomes vJass.execute(myFunction, 1, 10)
            },
        )
        .replaceNamed(
            find.customType,
            ({ indent, scope, typeName, gap = '', remainder = '' }) => {
                if (!indent || !typeName) {
                    throw new Error('Regex failed.');
                }
                if (find.functionKeyword.test(remainder)) {
                    return `---@class ${typeName}:function --`; //function interface. Just declare it for Emmy annotation.
                }
                let size = '';
                remainder = remainder.replace(
                    find.array,
                    (_, num: string, ending: string) => {
                        size = num;
                        return ending; //extract any comments the user may have included on the same line.
                    },
                );
                if (!size) {
                    return `${indent}---@class ${typeName}: ${gap} ${remainder}`;
                }
                if (scope) {
                    if (scope === 'public') {
                        remainder = `; _G[SCOPE_PREFIX.."${typeName}"] = "${typeName}"`;
                    }
                    indent += 'local ';
                }
                return `${
                    indent + typeName
                } ${gap} = vJass.dynamicArray(${size})${remainder}`;
            },
        );

    return functions
        .repeatAction((functions) => {
            return functions.replaceNamed(
                find.fullFunction,
                ({
                    indent,
                    func,
                    params,
                    rtype,
                    contents,
                }: Record<string, string | undefined>) => {
                    if (!func || !rtype || !contents || !params) {
                        throw new Error('Regex failure');
                    }

                    const emmyAnnotations = new Array<string>();
                    let returnEmmy = '',
                        argsResult = '';

                    const doFloorInt = (line: string) =>
                        line.replace(
                            find.floorInt,
                            (div) => div[0] + '//' + div[2],
                        );

                    func = func.trim();
                    if (rtype !== 'nothing') {
                        rtype = convertJASSTypeToLua(rtype);
                        if (config.useAlias) {
                            returnEmmy = ':' + rtype;
                        } else {
                            returnEmmy = `${indent}"---@return "${rtype}\n`;
                        }
                        if (rtype === 'integer') {
                            contents = contents.replace(
                                find.returnLine,
                                (returnLine) => doFloorInt(returnLine),
                            );
                        }
                    }

                    contents = contents
                        .replace(find.functionRef, '$1')
                        .replace(find.variableAssignment, (line, name) => {
                            if (isVarInt(name)) {
                                line = doFloorInt(line);
                            } else if (name === 'self') {
                                line += '; _ENV = Struct.environment(self)'; //needed for when the reference is reassigned after the fact.
                            }
                            return line;
                        });

                    const doEmmyParse = (type: string, name: string) =>
                        emmyAnnotations.push(
                            config.useAlias
                                ? `${name}: ${type}`
                                : `${indent}---@param ${name} ${type}`,
                        );

                    if (func.includes(':')) {
                        doEmmyParse('thistype', 'self');
                    }
                    if (!find.nothing.test(params)) {
                        //console.log("params:", params);
                        argsResult = params
                            .trim()
                            .replace(
                                getArgPairs,
                                (_, type: string, name: string) => {
                                    doEmmyParse(
                                        convertJASSTypeToLua(type),
                                        name,
                                    );
                                    return name;
                                },
                            );
                    }

                    let emmyResult = '',
                        allowEmmyParse = true;

                    if (config.useAlias) {
                        if (!returnEmmy && !emmyAnnotations.length) {
                            allowEmmyParse = false; //don't show ---@type fun()
                        }
                        if (allowEmmyParse) {
                            emmyResult = `${indent}---@type fun(${emmyAnnotations.join(
                                ', ',
                            )})${returnEmmy}\n`;
                        }
                    } else {
                        emmyResult = emmyAnnotations.join('\n') + returnEmmy;
                    }
                    return `${
                        emmyResult + indent + func
                    }(${argsResult})${contents}`;
                },
            );
        })
        .replace(find.endFunction, 'end');
};
