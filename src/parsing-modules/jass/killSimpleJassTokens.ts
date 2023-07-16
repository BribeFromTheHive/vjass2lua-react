import { ConfigModel } from '../../Components/configurables/config.model.ts';

const find = {
    debugs: /^(?<indent> *)debug +(?:(?:set|call) *)?/gm,
    endIfs: /^(?<indentAndEnd> *end)if/gm,
    chars: /'\\?(?<char>.)'/g, //convert 'a' or ';' into their integer equivalents.
    keywords: /^(?<indent> *)(?:set|call|constant) +/gm, //Keywords that don't exist in Lua
    hexCodes: /\$(?<hex>[0-9a-fA-F]+[^$])/g, //JASS "$hexcode" must be converted to "0xhexcode" to work in Lua.
};

export const killSimpleJASSTokens = (jass: string, config: ConfigModel) =>
    jass
        .replaceNamed(
            find.debugs,
            ({ indent = '' }) =>
                `${indent}${config.commentDebug ? '--debug ' : ''}`,
        )
        .replace(find.endIfs, '$<indentAndEnd>')
        .replaceNamed(find.chars, ({ char = '' }) =>
            char.charCodeAt(0).toString(),
        )
        .replace(find.keywords, '$<indent>')
        .replace(find.hexCodes, '0x$<hex>');
