import { ConfigModel } from '../../Components/configurables/config.model.ts';
import { regexJass } from '../regular-expressions/jass-expressions.ts';

export const killSimpleJASSTokens = (jass: string, config: ConfigModel) =>
    jass
        .replaceNamed(
            regexJass.namedCaptureGroups.debugs,
            ({ indent = '' }) =>
                `${indent}${config.commentDebug ? '--debug ' : ''}`
        )
        .replace(regexJass.namedCaptureGroups.endIfs, '$<indentAndEnd>')
        .replaceNamed(regexJass.namedCaptureGroups.chars, ({ char = '' }) =>
            char.charCodeAt(0).toString()
        )
        .replace(regexJass.namedCaptureGroups.uselessJassKeywords, '$<indent>')
        .replace(regexJass.namedCaptureGroups.hexCodes, '0x$<hex>');
