import {
    getEndParenthesisIndex,
    replaceLineBreak,
    zincVarFinder,
    zincVarPrefix,
} from './zincHelpers.ts';
import { pack } from '../encoding/encoderModel.ts';
import { ConfigModel } from '../../Components/configurables/config.model.ts';

// const parseZincVar = (
//     prefix: string,
//     args: string[],
//     isDeep: boolean
// ) => {
//     let
//         wholeMatch: string,
//         indent: string,
//         w1: string,
//         gap = ' ',
//         tailgap    = '',
//         w2: string,
//         array      = '',
//         remainder  = '',
//         sign,
//         tail       = ''
//     if (
//         w1===w2 ||
//         ignoredKeywords.has(w1) ||
//         ignoredKeywords.has(w2) ||
//         sign==='{'
//     ) {
//         //console.log('complete failure:',wholeMatch);
//         return wholeMatch;
//     }
//     remainder = remainder.replace(replaceLineBreak, ' ');
//
//     const spacebreaker = gap.search(seekLineBreakR);
//     if (spacebreaker >= 0) {
//         tailgap = gap.substring(spacebreaker) + tailgap;
//
//         gap = gap.substring(0, spacebreaker) || ' ';
//         //console.log('gap found:', w1 + gap + w2);
//     }
//     if (sign === ',') {
//         tail += `\n${indent + zincVarPrefix + w1}`;
//         //console.log('new tail:',tail);
//     }
//     tail += tailgap;
//
//     let result;
//     if (array) {
//         if (array === '[]') array = '';
//
//         result = `${w1} array ${w2 + array}`;
//     } else {
//         result = w1 + gap + w2;
//         //console.log('non-array found');
//     }
//     result += remainder;
//     const test = parseVariable(result);
//     if (test === result) {
//         console.log('failure:', wholeMatch);
//         return wholeMatch;
//     }
//     //console.log('new var:', prefix+result, 'indent:',indent.length);
//
//     if (!prefix) result = test;
//
//     result = indent + prefix + result;
//
//     //if (isDeep) console.log('deep var:',result+tail);
//
//     return pack.encode.zincvar(result) + tail;
// };

const parseZincVars = (str: string, prefix: string) => {
    const parseZincVarsByType = (whichType: number) => {
        const varTypeFinder = zincVarFinder[whichType];
        const isDeep = whichType > 1;

        // str = str.repeatAction((repeatStr: string) =>
        //     repeatStr.replace(
        //         varTypeFinder,
        //         (...args:string[]) =>
        //             parseZincVar(
        //                 prefix,
        //                 args,
        //                 isDeep
        //             )
        //     )
        // );
    };
    //console.log('shallow search:', str);

    parseZincVarsByType(1); //parse Zinc arrays
    parseZincVarsByType(0); //parse Zinc scalars

    if (str.search(new RegExp(zincVarPrefix)) >= 0) {
        //console.log('deep search:', str);
        //need to go deeper. Comments were sandwiched in between variable types and chained, breaking the flow.
        //Issue discovered in: https://www.hiveworkshop.com/threads/cam-system-v3.144480/

        parseZincVarsByType(3); //parse Zinc arrays, checking for comments.
        parseZincVarsByType(2); //Zinc scalars
    }
    str = pack.decode.zincvar(str);
    str = str.replace(new RegExp(zincVarPrefix, 'g'), '');
    return str;
};

export const parseZinc = (
    mainParsedStr: string,
    config: ConfigModel,
    baseIndent: string,
) => {
    //console.log(mainParsedStr,'\n',MainComponent.scriptblock);
    return mainParsedStr.replace(
        /^ *--! *zinc(.*?)^ *--! *endzinc/gms,
        (_, zincSource: string) => {
            const zincBracket =
                /(?:(?<isFunction>\b(?<functionOrSomethin>function|method|operator)\b\s*(?<functionName>[\w$]+)?(?<operatorSymbols>[[\]=\s]*)\((?<args>[\w$\s,]*?)\)\s*(?:->\s*(?<returnType>[\w$]+))?)|(?<isNotFunction>\b(if|else|elseif|while)\b(?<startpadding0>\s*)\((?:(?!then)[^{;])*?\))?)(?<startpadding1>\s*){(?<startpadding2>\s*)(?<contents>[^{}]*?)(?<endpadding1>\s*)}(?:(?<endpadding2>\s*)(?<isElse>else(?:if)?))?/gms;
            ///(?:(?<isFunction>\b(                   ?:function|method|operator)\b\s*(?<functionName>[\w$]+)?(?<operatorSymbols>[[\]=\s]*)\((?<args>[\w$\s,]*?)\)\s*(?:->\s*(?<returnType>[\w$]+))?)|(?<isNotFunction>\b(if|else|elseif|while)\b(?<startpadding0>\s*)\((?:(?!then)[^{;])*?\))?)(?<startpadding1>\s*){(?<startpadding2>\s*)(?<contents>[^{}]*?)(?<endpadding1>\s*)}(?:(?<endpadding2>\s*)(?<isElse>else(?:if)?))?/gms;

            ///(?:((\b(?:function|method|operator)\b\s*([\w$]+)?)([[\]=\s]*)\(([\w$\s,]*?)\)\s*(?:->\s*([\w$]+))?)|(\b(if|else|elseif|while)\b(\s*)(\((?:(?!then)[^{;])*?\))?))(\s*){(\s*)([^{}]*?)(\s*)}(?:(\s*)(else(?:if)?))?/gms;
            // corresponding information defined in the replacer function which uses this regular expression.

            zincSource = zincSource
                .replace(/\bconstant\s+/g, '')
                .replace(
                    /(.?)(&&|\|\||!)(.?)/g,
                    (_, startp = ' ', str: string, endp = ' ') => {
                        switch (str) {
                            case '&&':
                                str = 'and';
                                break;
                            case '||':
                                str = 'or';
                                break;
                            default:
                                str = 'not';
                        }
                        if (startp !== ' ') {
                            startp += ' ';
                        }
                        if (endp !== ' ') {
                            endp = ' ' + endp;
                        }

                        return startp + str + endp;
                    },
                )
                .replace(/([\w$]+[[\]\w$.]*)(\s*)([+\-*/])=/g, '$1$2=$1$3'); // += -= *= /= syntax isn't supported in Lua.

            const zincForLoop = (
                contents: string,
                remainder: string,
                endspacing: string,
            ) => {
                let result = contents;
                let indent = baseIndent;
                if (endspacing === '; ') indent = '';

                result = result.replace(
                    /([^;]+);([^;]+);([^;]+)/,
                    (_, start, comp, end) => {
                        //need to zap to 'endwhile' in order to convey to the parser that this block is no longer wrapped in curly brackets.
                        return `${start}; while ${comp} do ${remainder}${endspacing}${indent}${end}${endspacing}endwhile`;
                    },
                );
                if (result !== contents) return result;

                return result.replace(
                    /([^=><!]+) *([=><!]+) *([^=><!]+) *([=><!]+) *([^=><!]+)/,
                    (
                        _,
                        initFor: string,
                        fromFor: string,
                        iterFor: string,
                        tilFor: string,
                        endFor: string,
                    ) => {
                        let incDec = 1;
                        if (fromFor[0] === '>') {
                            incDec = -1;
                        }
                        let iterVal = initFor;
                        if (fromFor[1] === undefined) {
                            const iterInt = +iterVal;
                            if (!isNaN(iterInt)) {
                                iterVal = (iterInt + incDec).toString();
                            } else iterVal += '+' + incDec;
                        }
                        if (iterFor[iterFor.length - 1] === ' ') {
                            iterFor = iterFor.slice(0, -1);
                        }
                        return `${iterFor}=${iterVal}; while ${iterFor}${tilFor}${endFor} do ${remainder}${endspacing}${indent}${iterFor}=${iterFor}+${incDec}${endspacing}endwhile`;
                    },
                );
                //console.log('no loop match');
            };

            /*
                Parsing within code. Do I do a descent from library { > public {} > struct {} > function {} } and stitch it all back together?

                Currently, finding it from block to block at random,
            */

            zincSource = zincSource
                .replace(/\belse\s*(?:static *)?if/g, 'elseif')
                .repeatAction((str: string) => {
                    //Zinc allows people to write if (conds) action; instead of forcing if (cond) {action}, hence a lot more complexity here to add brackets.
                    str = str.replace(
                        /\b(if|elseif|else)\b((?:(?!then|if|else)[^{}])*?)(;|\b(?:while|for)\s*{\s*[^{}]*?\s*})/g,
                        (
                            ifMatch,
                            ifStatement: string,
                            ifContents: string,
                            endStatement: string,
                        ) => {
                            if (ifStatement !== 'else') {
                                const endPos =
                                    getEndParenthesisIndex(ifContents);
                                if (endPos >= 0) {
                                    const cnt1 = ifContents.substring(
                                        0,
                                        endPos,
                                    );
                                    const cnt2 = ifContents.substring(endPos);
                                    ifContents = `${cnt1} { ${cnt2}`;
                                    //console.log(endPos, 'cnt1:',cnt1, 'cnt2:',cnt2);
                                }
                            } else {
                                if (endStatement === ';') {
                                    if (/endif/.test(ifContents)) {
                                        return ifMatch;
                                    }
                                    //console.log('ifStatement', ifStatement, 'ifContents', ifContents);
                                    return `${ifStatement + ifContents} endif `;
                                }
                                ifStatement += ' { ';
                            }
                            endStatement =
                                endStatement === ';' ? '}' : `${endStatement}}`;
                            //console.log('if:', ifStatement, 'contents:', ifContents, 'end:', endStatement);
                            return ifStatement + ifContents + endStatement;
                        },
                    );

                    //console.log('for', str);

                    str = str
                        .replace(
                            /\bfor *\(((?:[^(){}\r\n]*(?:\([^(){}]*\))*)*)\)((?:(?!do)[^{}])*?);/g,
                            (_, forConds: string, forLoop: string) =>
                                zincForLoop(forConds, forLoop, '; '),
                        )
                        .replace(
                            /\bfor *\(((?:[^(){}]*(?:\([^(){}]*\))*)*)\)(\s*)\{([^{}]*(\r?\n *)?)}/g,
                            (
                                _,
                                forConds: string,
                                spacing: string,
                                forLoop: string,
                                endspacing = '; ',
                            ) =>
                                zincForLoop(
                                    forConds,
                                    spacing + forLoop,
                                    endspacing,
                                ),
                        )
                        .replaceNamed(
                            zincBracket,
                            (
                                {
                                    isFunction,
                                    functionOrSomethin = '',
                                    functionName,
                                    operatorSymbols,
                                    returnType = 'nothing',
                                    //isNotFunction,
                                    name,
                                    isElse,
                                    args = '',
                                    startpadding0,
                                    condOrRange,
                                    startpadding1,
                                    startpadding2,
                                    contents,
                                    endpadding1,
                                    endpadding2,
                                }: Partial<Record<string, string>>,
                                wholeBracketMatch,
                            ) => {
                                startpadding1 = startpadding1 || ' ';
                                startpadding2 = startpadding2 || ' ';
                                endpadding1 = endpadding1 || ' ';
                                if (isFunction != null) {
                                    let isValidFunc = 'function';
                                    //console.log('is function:', isFunction);
                                    if (functionName != null) {
                                        isValidFunc =
                                            functionOrSomethin.replace(
                                                /^(method|function|operator).*/ms,
                                                '$1',
                                            );
                                        if (
                                            isValidFunc === functionOrSomethin
                                        ) {
                                            //console.log('failed to match function:', wholeBracketMatch) ;
                                            return wholeBracketMatch;
                                        }
                                    }
                                    if (isValidFunc === 'function') {
                                        endpadding1 += 'endfunction';
                                        if (functionName === 'onInit')
                                            endpadding1 +=
                                                "; OnInit(function() Require.strict 'vJass2Lua'; onInit() end)";
                                    } else {
                                        endpadding1 += 'endmethod';
                                    }
                                    //console.log(args);
                                    args = args
                                        .replace(replaceLineBreak, ' ')
                                        .replace(/  +/g, ' ')
                                        .replace(/^\s*$/m, 'nothing');

                                    args = ` takes ${args} returns ${returnType}`;
                                    //console.log(args);

                                    contents = (
                                        startpadding2 + contents
                                    ).replace(
                                        /\belse\s*while\b[^{}]*?endwhile(?!\s+endif\b)/gm,
                                        '$& endif',
                                    );
                                    contents = parseZincVars(
                                        contents,
                                        'local ',
                                    ).replace(
                                        /\bstatic\s+method\s+/,
                                        'function',
                                    ); //convert static method to the 'function' keyword used by vJass

                                    return pack.encode.zincfunc(
                                        config,
                                        functionOrSomethin +
                                            operatorSymbols +
                                            args +
                                            startpadding1 +
                                            contents +
                                            endpadding1,
                                    );
                                } else {
                                    //console.log('is not function:', isNotFunction);
                                    startpadding0 = startpadding0 || ' ';
                                    switch (name) {
                                        case 'if':
                                        case 'elseif':
                                        case 'else':
                                            if (condOrRange) {
                                                let endPos =
                                                    getEndParenthesisIndex(
                                                        condOrRange,
                                                    );

                                                if (
                                                    endPos >= 0 &&
                                                    endPos < condOrRange.length
                                                ) {
                                                    //rebuild the output to allow this match to be "discarded" and parsed after any contained while/for loops
                                                    endPos =
                                                        getEndParenthesisIndex(
                                                            wholeBracketMatch,
                                                        );

                                                    const cnt1 =
                                                        wholeBracketMatch.substring(
                                                            0,
                                                            endPos,
                                                        );
                                                    let cnt2 =
                                                            wholeBracketMatch.substring(
                                                                endPos,
                                                            ),
                                                        cnt3 = '';

                                                    if (isElse) {
                                                        const i =
                                                                cnt2.lastIndexOf(
                                                                    'else',
                                                                ),
                                                            splitCnt2_3 = cnt2;
                                                        cnt2 = cnt2.substring(
                                                            0,
                                                            i,
                                                        );
                                                        cnt3 =
                                                            splitCnt2_3.substring(
                                                                i,
                                                            );
                                                    }
                                                    //console.log('cnt1',cnt1, 'cnt2',cnt2 , 'cnt3',cnt3);
                                                    return `${cnt1}{${cnt2}}${cnt3}`;
                                                }
                                                //console.log('parsing conds for', wholeBracketMatch)
                                                condOrRange = `${
                                                    condOrRange + startpadding1
                                                }then`;
                                            } else {
                                                condOrRange = '';
                                            }
                                            if (isElse) {
                                                if (endpadding2 === ' ') {
                                                    endpadding2 = '';
                                                }
                                                endpadding1 +=
                                                    endpadding2 + isElse;
                                            } else {
                                                endpadding1 += 'endif';
                                            }
                                            return (
                                                name +
                                                startpadding0 +
                                                condOrRange +
                                                startpadding2 +
                                                contents +
                                                endpadding1
                                            );
                                        case 'while':
                                            if (isElse) {
                                                endpadding2 += isElse;
                                            } else {
                                                endpadding2 = '';
                                            }
                                            //console.log('parsing while', name + startpadding0+condOrRange + ' do ' +  contents+endpadding1+'endwhile '+endpadding2)
                                            return `${
                                                name +
                                                startpadding0 +
                                                condOrRange
                                            } do ${
                                                contents + endpadding1
                                            }endwhile ${endpadding2}`;
                                        default:
                                            throw new Error(
                                                'something weird happened',
                                            );
                                        //return name + startpadding0+condOrRange + contents+endpadding1+'end'+name;
                                    }
                                }
                            },
                        );
                    //let what = str
                    //if (what !== str) logDiff(what, str);
                    return str;
                });
            //Extract Zinc structs and handle the struct and library scopes separately.
            //console.log('zinc contents:',zincSource);

            const zincFindPubPrivBrackets =
                /\b(public|private)\s*[{]([^{}]*)[}]/g;

            const ProcessStructOrModule = (header: string, str: string) => {
                str = str
                    .replace(zincFindPubPrivBrackets, (_, a, b) => {
                        //console.log('getting rid of public/private:',b);
                        b = parseZincVars(b, a + ' ');
                        return b;
                    })
                    .replace(/\b(?:optional\s+)*module\b/g, 'implement')
                    .repeatAction(pack.decode.zincfunc);

                return pack.encode.zincstruct(
                    config,
                    header + str + 'endstruct',
                );
            };

            //console.log(zincSource);
            zincSource = zincSource
                .replace(
                    /(struct[\s\w$[\]]*?)\{((?:[^{}]*(?:\{[^{}]*})*)*)}/g,
                    (_, declaration, contents) => {
                        declaration = declaration.replace(
                            /\[[^[\]]*]/,
                            ' extends array ',
                        );

                        //console.log('struct contents:',contents);
                        return ProcessStructOrModule(declaration, contents);
                    },
                )
                .replace(
                    /\bmodule\s+([\w$]+)\s*\{((?:[^{}]*(?:\{[^{}]*})*)*)}/g,
                    (_, name, contents) => {
                        return ProcessStructOrModule(
                            'module ' + name + '\n',
                            contents,
                        );
                    },
                );

            const zincProcessPublic = (str: string) =>
                pack.encode.zincpublic(config, parseZincVars(str, ''));

            //process public/private brackets outside of structs
            zincSource = zincSource
                .replace(zincFindPubPrivBrackets, (_, a, b) => {
                    if (a === 'public') b = zincProcessPublic(b);
                    return b;
                })
                .replace(
                    /\bpublic\b\s+(•.+)/g,
                    (_, line: string) => zincProcessPublic(line), //process single-declaration public function/struct
                )
                .replace(
                    /\bpublic\b\s+(\S[^;]+;)/g,
                    (_, line: string) => zincProcessPublic(line), //process single-declaration public variable
                )
                .replace(
                    /\bprivate\s+/g,
                    '', //get rid of private keywords added unnecessarily by the user.
                );

            zincSource = zincSource.replace(
                /•#(?:fun|zst)/g,
                (match) => 'private ' + match,
            );

            //console.log(zincSource);

            zincSource = parseZincVars(zincSource, 'local ');

            zincSource = zincSource.replace(/\btype\b/g, 'private $&');

            //console.log(zincSource);

            zincSource = pack.decode.zincpublic(zincSource);

            zincSource = pack.decode.zincstruct(zincSource);

            zincSource = zincSource
                .repeatAction(pack.decode.zincfunc)

                .replace(/\b(local *)*public /g, '')

                .replace(
                    /^(( *)\w[^\r\n;]*)(\bwhile\b[^{}]*?)endwhile *([^ •\d#]*)/gm,
                    (
                        _,
                        whatever: string,
                        spacing = '',
                        block: string,
                        trail = '',
                    ) => {
                        //resolves issue encountered with RetroFade where there is an if-block without brackets containing a while-loop

                        block = block.replace(/\n(?=.*\n)/g, `\n${baseIndent}`);
                        return `${whatever}\n${spacing}${baseIndent}${block}${baseIndent}endwhile\n${
                            spacing + trail
                        }`;
                    },
                )
                .replace(/;( *)(\r?\n|•)/gm, ' $1$2') //delete all trailing semicolons.
                .replace(/^( *); */gm, '$1 ') //delete all leading semicolons.
                .replace(/end(?:if|while|)/g, 'end')

                //console.log('about to parse library:',zincSource);

                .replace(
                    /\b(library\b[^{]*?)\{((?:[^{}]*(?:\{[^{}]*})*)*)}/gs,
                    (_, a, b) =>
                        //console.log('parsing library: ',a);
                        `${a.replace(replaceLineBreak, ' ')}\n${b}\nendlibrary`,
                )
                .replace(/(;\s*);/g, '$1');

            return pack.encode.zinc(config, zincSource); //pack Zinc away into an array
        },
    );
};
