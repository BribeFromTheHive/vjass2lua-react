import {
    regexFragment,
} from './string-expression-builders.ts';
import { RegexCollection } from './regex-interface.ts';

class RegexStructs implements RegexCollection {
    readonly noCaptureGroups = {
        stubPrefixes: /\bstub\s+/g,
    };
    readonly singleCaptureGroup = {};
    readonly namedCaptureGroups = {
        /**
         * `classIndent`: leading indent at start of sentence.
         *
         * `classScope`: public or private, if included.
         *
         * `whichClass`: either `struct` OR `module`.
         *
         * `className`: name of struct or module.
         *
         * `classBody`: contents of the struct or module (which need to be parsed considerably with lots of further regex'ing).
         */
        structs_or_modules:
            /^(?<classIndent> *)(?<classScope>private|public)* *(?<whichClass>struct|module) *(?<className>[$\w]+) *(?<classBody>.+?^ *end)(?:struct|module)/gms,
    };
}

export const regexStructs = new RegexStructs();

export const find = {
    structs_or_modules:
        /^(?<classIndent> *)(?<classScope>private|public)* *(?<whichClass>struct|module) *(?<className>[$\w]+) *(?<classBody>.+?^ *end)(?:struct|module)/gms,

    extends: /[()] -- *extends +([$\w]+)/,

    stubPrefixes: /\bstub\s+/g,
    properties: /^( *)(static|readonly|public|private|method) +(.*)/gm,

    //remove any case of 'static' and 'constant'.
    static: /^( *)static *(?:constant +)*/m,
    scopedStatics: /^( *)(public|private) *static(?: *constant)* +/gm,

    method: /^(?:method)* *\b([$\w]+)\b(.*)/m,
    endmethods: /\bendmethod\b/gm,

    //implied 'this' in vJass doesn't work outside of structs, so we only need this replacer within a struct/module.
    these: /\bthis\b/g,

    //dot-syntax doesn't work in Lua without something before the dot.
    isolatedDots: new RegExp(
        `([^\\w\\])])\\.${regexFragment.captureVariable}`,
        'gm'
    ),
    implements: new RegExp(
        `^( *)implement +(?:optional *)*${regexFragment.captureVariable}`,
        'gm'
    ),

    operatorType: /^ *(?:(\[ *])|([$\w]+)) *(=*) *(.*)/m, //find which type of operator this is.
    operatorGet: /takes +[$\w]+ +([$\w]+\b|\$).*/, //find an operator with one parameter.
    operatorSet: /takes +[$\w]+ +([$\w]+) *, *[$\w]+ *([$\w]+\b|\$).*/, //find an operator with two parameters.
    operatorBodies: /thistype:_operator[gs]et[(].*?endmethod/gs, //needed to close off method operators with a parenthesis.

    arrays: /([\w$]+) +array +([\w$]+)/g,
    variables: /(?<!function[\s\S]+)([\w$]+) +([\w$]+)/g,
} as const;
