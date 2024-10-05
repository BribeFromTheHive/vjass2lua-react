import { convertJASSTypeToLua, getArgPairs } from '../parseHelpers.ts';
import { pack } from '../encoding/encoderModel.ts';
import { ConfigModel } from '../../Components/configurables/config.model.ts';
import { regexJass } from '../regular-expressions/jass-expressions.ts';

export const parseNatives = (natives: string, config: ConfigModel) => {
    if (config.deleteNatives) {
        //comment-out natives
        return natives.replace(
            regexJass.namedCaptureGroups.natives,
            (wholeMatch) => pack.encode.comment(config, wholeMatch)
        );
    } else {
        //really only useful for parsing through something like common.j:
        return natives.replaceNamed(
            regexJass.namedCaptureGroups.natives,
            ({ indent, remainder }) => {
                if (config.useAlias) {
                    let name = '',
                        args = '',
                        returns = '',
                        newRemainder = '',
                        gap = '';
                    if (!remainder) {
                        throw new Error('Regex failure');
                    }
                    for (const [
                        ,
                        rawName,
                        rawGap,
                        rawArgs,
                        rawReturns,
                        rawRemainder,
                    ] of remainder.matchAll(
                        regexJass.namedCaptureGroups.argsDeclaration
                    )) {
                        name = rawName;
                        if (rawReturns !== 'nothing') {
                            returns = ': ' + convertJASSTypeToLua(rawReturns);
                        }
                        if (!regexJass.noCaptureGroups.nothingKeyword.test(rawArgs)) {
                            args = [...rawArgs.matchAll(getArgPairs)]
                                .map(
                                    ([, type, name]) =>
                                        `${name}: ${convertJASSTypeToLua(type)}`
                                )
                                .join(', ');
                        }
                        gap = rawGap;
                        newRemainder = rawRemainder;
                    }
                    return `${indent}${name}=nil${gap}---@type fun(${args})${returns} (native)${newRemainder}`;
                }
                return `${indent}function${remainder} endfunction --(native)`;
            }
        );
    }
};
