import { ignoredVJassKeywords } from './ignoredKeywords.ts';
import { regexFragment } from './regular-expressions/string-expression-builders.ts';

export const ignoredKeywords = new Map(
        ignoredVJassKeywords.map((keyword) => [keyword, true])
    ),
    typesJASSToLua = [
        ['real', 'number'],
        ['code', 'function'],
    ] as const,
    mapJASSTypeToLua = new Map(typesJASSToLua),
    convertJASSTypeToLua = (type: string) =>
        mapJASSTypeToLua.get(type as (typeof typesJASSToLua)[number][0]) ||
        type,
    getArgPairs = new RegExp(`${regexFragment.captureVariable} +${regexFragment.captureVariable}`, 'g'),
    seekLineBreak = '\\r?\\n',
    seekLineBreakR = new RegExp(seekLineBreak);

