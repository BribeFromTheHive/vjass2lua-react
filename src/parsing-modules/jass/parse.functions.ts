import { convertJASSTypeToLua, getArgPairs } from '../parseHelpers.ts';
import { isVarInt } from './parse.variables';
import { ConfigModel } from '../../Components/configurables/config.model.ts';
import { regexJass } from '../regular-expressions/jass-expressions.ts';

export const parseFunctions = (functions: string, config: ConfigModel) => {
    //Fix vJass dynamic function calling/referencing.
    functions = functions
        .replaceNamed(
            regexJass.namedCaptureGroups.execEval,
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
            }
        )
        .replaceNamed(
            regexJass.namedCaptureGroups.customType,
            ({ indent, scope, typeName, gap = '', remainder = '' }) => {
                if (!indent || !typeName) {
                    throw new Error('Regex failed.');
                }
                if (regexJass.noCaptureGroups.functionKeyword.test(remainder)) {
                    return `---@class ${typeName}:function --`; //function interface. Just declare it for Emmy annotation.
                }
                let size = '';
                remainder = remainder.replace(
                    regexJass.namedCaptureGroups.array,
                    (_, num: string, ending: string) => {
                        size = num;
                        return ending; //extract any comments the user may have included on the same line.
                    }
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
            }
        );

    return functions
        .repeatAction((functions) => {
            return functions.replaceNamed(
                regexJass.namedCaptureGroups.fullFunction,
                ({ indent, func, params, rtype, contents }) => {
                    if (!func || !rtype || !contents || !params) {
                        throw new Error('Regex failure');
                    }

                    const emmyAnnotations = new Array<string>();
                    let returnEmmy = '',
                        argsResult = '';

                    const doFloorInt = (line: string) =>
                        line.replace(
                            regexJass.noCaptureGroups.floorInt,
                            (div) => div[0] + '//' + div[2]
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
                                regexJass.noCaptureGroups.returnLine,
                                (returnLine) => doFloorInt(returnLine)
                            );
                        }
                    }

                    contents = contents
                        .replace(regexJass.singleCaptureGroup.functionRef, '$1')
                        .replaceNamed(
                            regexJass.namedCaptureGroups.variableAssignment,
                            ({ varName }, wholeMatch) => {
                                if (!varName) {
                                    throw new Error('Regex Failed');
                                }
                                if (isVarInt(varName)) {
                                    wholeMatch = doFloorInt(wholeMatch);
                                } else if (wholeMatch === 'self') {
                                    //needed for when the reference is reassigned after the fact.
                                    wholeMatch +=
                                        '; _ENV = Struct.environment(self)';
                                }
                                return wholeMatch;
                            }
                        );

                    const doEmmyParse = (type: string, name: string) =>
                        emmyAnnotations.push(
                            config.useAlias
                                ? `${name}: ${type}`
                                : `${indent}---@param ${name} ${type}`
                        );

                    if (func.includes(':')) {
                        doEmmyParse('thistype', 'self');
                    }
                    if (!regexJass.noCaptureGroups.nothingKeyword.test(params)) {
                        console.log('params:', params);
                        argsResult = params
                            .trim()
                            .replaceArray(
                                getArgPairs,
                                ([type, name], wholeMatch) => {
                                    if (!type || !name) {
                                        throw new Error(
                                            `Regex Failed! wholeMatch: ${wholeMatch} type: ${type} name: ${name}`
                                        );
                                    }
                                    doEmmyParse(
                                        convertJASSTypeToLua(type),
                                        name
                                    );
                                    return name;
                                }
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
                                ', '
                            )})${returnEmmy}\n`;
                        }
                    } else {
                        emmyResult = emmyAnnotations.join('\n') + returnEmmy;
                    }
                    return `${
                        emmyResult + indent + func
                    }(${argsResult})${contents}`;
                }
            );
        })
        .replace(regexJass.noCaptureGroups.endFunctionKeyword, 'end');
};
