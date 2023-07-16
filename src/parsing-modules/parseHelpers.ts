import { captureVariable } from './vjass/parse.vjass-misc';
import { ignoredVJassKeywords } from './ignoredKeywords.ts';

export const ignoredKeywords = new Map(
        ignoredVJassKeywords.map((keyword) => [keyword, true]),
    ),
    convertJASSTypeToLua = (type: string) =>
        type === 'real' ? 'number' : type === 'code' ? 'function' : type,
    getArgPairs = new RegExp(`${captureVariable} +${captureVariable}`, 'g'),
    seekLineBreak = '\\r?\\n',
    seekLineBreakR = new RegExp(seekLineBreak);

type ReplacerFn = (
    group: Record<string, string | undefined>,
    wholeMatch: string,
    offset: number,
) => string;

declare global {
    interface String {
        repeatAction: (action: (str: string) => string) => string;
        replaceNamed: (regExp: RegExp, replacerFn: ReplacerFn) => string;
    }
}

String.prototype.replaceNamed = function (
    regExp: RegExp,
    replacerFn: ReplacerFn,
) {
    // Breaks down the normal string.replace method to insert the named capture groups
    // as the first parameter. This allows easy object destructuring withing parameters.
    return this.replace(regExp, (...args) =>
        replacerFn(args.at(-1), args[0], args.at(-3)),
    );
};

String.prototype.repeatAction = function (
    this: string,
    action: (str: string) => string,
) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let str = this,
        tempStr: string;
    do {
        tempStr = str;
        str = action(str);
    } while (tempStr !== str);

    return str;
};
