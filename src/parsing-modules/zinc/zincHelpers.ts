import { seekLineBreak } from '../parseHelpers.ts';
import { regexFragment } from '../regular-expressions/string-expression-builders.ts';

export const replaceLineBreak = new RegExp(seekLineBreak, 'g'),
    getEndParenthesisIndex = (parenthesisStr: string, startingDepth = 0) => {
        let depth = startingDepth;

        for (let i = 0; i < parenthesisStr.length; i++) {
            switch (parenthesisStr[i]) {
                case '(':
                    depth++;
                    break;
                case ')':
                    if (--depth <= 0) return i + 1;
            }
        }
        return -1;
    };

const confirmBracketKeywordCache = {} as Record<string, RegExp>,
    confirmBracketKeyword = (whichKeyWord: string, stringToMatch: string) => {
        if (!confirmBracketKeywordCache[whichKeyWord]) {
            confirmBracketKeywordCache[whichKeyWord] = new RegExp(
                '\\W' + whichKeyWord + '\\W'
            );
        }
        return stringToMatch.match(confirmBracketKeywordCache[whichKeyWord]);
    };
let addExtraEndBlock: boolean; //Meant for parsing stuff within Zinc functions.

export const parseBracketContents = (
    bracketStr: string,
    inName: string,
    startingDepth = 0,
    terminate = ''
) => {
    let depth = startingDepth,
        lastDepthPoint = 0, //used for tracking regex keywords upon increasing the bracket depth
        wordDepth = 0,
        keyWord = '';

    addExtraEndBlock = false;

    const findDepthPoint = /\b(?:for|while|else|if)\b/;

    bracketLoop: for (let i = 0; i < bracketStr.length; i++) {
        switch (bracketStr[i]) {
            case '{':
                if (
                    depth++ === startingDepth &&
                    terminate !== '' &&
                    lastDepthPoint === 0
                ) {
                    const index =
                        bracketStr.substring(0, i).match(findDepthPoint)
                            ?.index ?? -1;

                    if (index >= 0) {
                        lastDepthPoint = index;
                        addExtraEndBlock = true; //happens with stuff like "else while (blah) {...do stuff...}" where "else" has no brackets but contains something that has brackets.
                    }
                }
                continue bracketLoop;
            case '}':
                if (--depth <= 0) {
                    return i + 1; //decrease depth when a closing bracket is found. If 0 or less, return that index.
                }
                continue bracketLoop;
            case terminate:
                if (depth === startingDepth) return i + 1; //if no brackets were used, terminate at the first escape character (which would be a ";" if defined)
            //fall through
            default:
                continue bracketLoop;
            case 'e':
                keyWord = 'else';
                break;
            case 'f':
                keyWord = 'for';
                break;
            case 'w':
                keyWord = 'while';
                break;
            case 'i':
                keyWord = 'if';
        }
        wordDepth = keyWord.length;
        if (bracketStr.substring(i, i + wordDepth) === keyWord) {
            const j = i + wordDepth;
            if (keyWord === 'else' && bracketStr.substring(j, j + 2) === 'if') {
                keyWord = 'elseif';
                wordDepth += 2;
            }
            if (
                confirmBracketKeyword(
                    keyWord,
                    bracketStr.substring(i - 1, j + 1)
                )
            ) {
                let endPos;
                switch (keyWord) {
                    case 'else':
                        endPos = j;
                        break;
                    default:
                        endPos = getEndParenthesisIndex(
                            bracketStr.substring(j)
                        ); //fall through
                    case 'for':
                    case 'while':
                        //add string " do "
                        break;
                    case 'elseif':
                    case 'if':
                        //add string " then "
                        break;
                }
                i = j - 1;
            }
        }
    }
    return -1; //insufficient endbrackets were found.
};
const parseZincFunctions = (str: string) => {
    return str.repeatAction((funcStr) => {
        const funcParts = funcStr.match(
            /(function|(?:static\s+)?method)([^{}()]*)\(([^{}()]*)\)([^{}()]*)\{/
        );
        if (funcParts != null) {
            //[0] = whole string match - used for getting the length to determine how much of the substring to clip out.
            //[1] = function or method
            //[2] = name and any operator stuff
            //[3] = parameters
            //[4] = return properties
            //[5] = the point in the string where this match begins

            const pos1 = +funcParts[5];
            const pos2 = funcParts[0].length;

            /*if (funcParts[1] !== "function" && funcParts[1] !== "method")
            {
                funcParts[1] = "method" //remove "static" keyword.
            }*/

            let remainder = funcStr.substring(pos1 + pos2);

            const pos3 = parseBracketContents(remainder, 'function', 1);

            if (pos3 < 0)
                throw new Error(
                    'syntax error: function without end bracket: ' +
                        funcParts[0]
                );

            const contents = remainder.substring(0, pos3);
            remainder = remainder.substring(pos3);

            return funcStr.substring(0, pos1) + contents + remainder;
        }
        return funcStr;
    });
};

export const zincVarPrefix = 'KILL_THIS_ZINC_VAR_PREFIX_', //used to catch extra types that were chained with commas
    zincVarFinder = Array.from({ length: 4 }, (_, i) => {
        const deepSearch = i & 2;

        //pattern is set to capture two vJass variables (the first is assumed to be a type, but I will check against it later to make sure it's not a keyword).
        return new RegExp(
            `${deepSearch ? '^' : ''}( *)(?:${zincVarPrefix})*(\\$?${
                regexFragment.rawVariable
            }\\b\\$?)${
                deepSearch
                    ? '(\\s*)((?:^ *•[^\\r\\n]*\\s*)*)' //extremely expensive operation, but includes comments as well as whitespace.
                    : '(\\s+)()'
            }${regexFragment.captureVariable}${
                i & 1 ? '\\s*(\\[[^\\[\\]]*?\\])' : '()' //a needless capture group is needed in order to preserve the sequence of the capture groups.

                //pattern set to find a semicolon or comma, skips up to 2 levels of parenthesis (if present), then includes the remainder of the line.
            }([^;,(•]*?(?:\\([^()]*(?:\\([^()]*\\))*(?:[^()]*\\([^()]*\\))*[^()]*\\))*)\\s*([;,{}])( *•.*)*`,

            deepSearch ? 'gm' : 'g'
        );
    });
