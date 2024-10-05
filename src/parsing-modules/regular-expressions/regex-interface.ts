export interface RegexCollection {
    // Expressions without capture groups; the full match should be used instead
    readonly noCaptureGroups: Record<string, RegExp>;

    // Expressions with just one capture group.
    readonly singleCaptureGroup: Record<string, RegExp>;

    // Expressions with named capture groups. The names of the groups are annotated in the comments.
    readonly namedCaptureGroups: Record<string, RegExp>;
}

export type NamedReplacerFn = (
    group: Record<string, string | undefined>,
    wholeMatch: string,
    offset: number
) => string;

export type SimpleReplacerFn = (
    groups: (string | undefined)[],
    wholeMatch: string,
    offset: string
) => string;

declare global {
    interface String {
        // Performs an action on a string until the action returns the same value it was given.
        repeatAction: (actionFn: (str: string) => string) => string;

        // Breaks down the normal string.replace method to insert the named capture groups
        // as the first parameter. This allows easy object destructuring within parameters.
        replaceNamed: (regExp: RegExp, replacerFn: NamedReplacerFn) => string;

        //Places the capture groups into an array, which helps to enforce type safety rather than using 'any[]'.
        replaceArray: (regExp: RegExp, replacerFn: SimpleReplacerFn) => string;
    }
}

String.prototype.replaceArray = function (regExp, replacerFn) {
    return this.replace(regExp, (...args) => {
        console.log(regExp, 'replacer args: ', ...args);
        return replacerFn(args.slice(1, -2), args[0], args.at(-2));
    });
};

String.prototype.replaceNamed = function (regExp, replacerFn) {
    return this.replace(regExp, (...args) =>
        replacerFn(args.at(-1), args[0], args.at(-3))
    );
};

String.prototype.repeatAction = function (
    this: string,
    action: (str: string) => string
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
