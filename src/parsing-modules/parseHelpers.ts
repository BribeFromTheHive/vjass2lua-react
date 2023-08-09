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

type NamedReplacerFn = (
    group: Record<string, string | undefined>,
    wholeMatch: string,
    offset: number,
) => string;

type SimpleReplacerFn = (
    groups: (string | undefined)[],
    wholeMatch: string,
    offset: string,
) => string;

declare global {
    interface String {
        // Performs an action on a string until the action returns the same value it was given.
        repeatAction: (actionFn: (str: string) => string) => string;

        // Breaks down the normal string.replace method to insert the named capture groups
        // as the first parameter. This allows easy object destructuring within parameters.
        replaceNamed: (regExp: RegExp, replacerFn: NamedReplacerFn) => string;

        //Places the capture groups into an array, which helps to enforce type safety rather than using TS's 'any[]'.
        replaceArray: (regExp: RegExp, replacerFn: SimpleReplacerFn) => string;
    }
}

String.prototype.replaceArray = function (regExp, replacerFn) {
    return this.replace(regExp, (...args) => {
        console.log(regExp, 'replacer args: ', ...args);
        return replacerFn(args.slice(1, -2), args[0], args.at(-2));
    });
};

String.prototype.replaceNamed = function (
    regExp: RegExp,
    replacerFn: NamedReplacerFn,
) {
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
