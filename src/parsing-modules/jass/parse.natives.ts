import { convertJASSTypeToLua, getArgPairs } from '../parseHelpers.ts';
import { pack } from '../encoding/encoderModel.ts';
import { ConfigModel } from '../../Components/configurables/config.model.ts';

const find = {
    natives: /^( *)(?:constant)? *native\b([^•\r\n]+)/gm,
    argsDeclaration:
        /([$\w]+)( +)takes +([$\w, ]+ +)*?\breturns +([$\w]+)(.*?)/,
    nothing: /\bnothing\b/,
};

export const parseNatives = (natives: string, config: ConfigModel) => {
    if (config.deleteNatives) {
        //comment-out natives
        return natives.replace(find.natives, (str) =>
            pack.encode.comment(config, str),
        );
    } else {
        //really only useful for parsing through something like common.j:
        return natives.replace(
            find.natives,
            (_, indent: string, remainder: string) => {
                if (config.useAlias) {
                    let name = '',
                        args = '',
                        returns = '',
                        newRemainder = '',
                        gap = '';
                    for (const [
                        ,
                        rawName,
                        rawGap,
                        rawArgs,
                        rawReturns,
                        rawRemainder,
                    ] of remainder.matchAll(find.argsDeclaration)) {
                        name = rawName;
                        if (rawReturns !== 'nothing') {
                            returns = ': ' + convertJASSTypeToLua(rawReturns);
                        }
                        if (!find.nothing.test(rawArgs)) {
                            args = [...rawArgs.matchAll(getArgPairs)]
                                .map(
                                    ([, type, name]) =>
                                        `${name}: ${convertJASSTypeToLua(
                                            type,
                                        )}`,
                                )
                                .join(', ');
                        }
                        gap = rawGap;
                        newRemainder = rawRemainder;
                    }
                    return `${indent}${name}=null${gap}---@type fun(${args})${returns} (native)${newRemainder}`;
                }
                return `${indent}function${remainder} endfunction --(native)`;
            },
        );
    }
};
