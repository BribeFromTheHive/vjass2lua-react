import { RegexCollection } from './regex-interface.ts';

class RegexJass implements RegexCollection {
    readonly noCaptureGroups = {
        //Look for simple JASS division (/) rather than comments (//).
        floorInt: /[^/]\/[^/]/g,
        returnLine: /\breturn\b.+\/.+/g,
        functionKeyword: /\bfunction\b/,
        nothingKeyword: /\bnothing\b/,
        endFunctionKeyword: /\bendfunction\b/g,
        novjassBlocks: /^ *\/\/! *novjass\b.*?^ *\/\/! *\bendnovjass\b/gms,
        //This vJass feature is the same as simply reading the variable in Lua.
        exists: /[.]exists\b/g,
    } as const;

    readonly namedCaptureGroups = {
        // group: `indent`
        debugs: /^(?<indent> *)debug +(?:(?:set|call) *)?/gm,
        // group: `indentAndEnd`
        endIfs: /^(?<indentAndEnd> *end)if/gm,
        /**
         * convert 'a' or ';' into their integer equivalents.
         *
         * group: `char`
         */
        chars: /'\\?(?<char>.)'/g,
        /**
         * Keywords that don't exist in Lua (set, call, constant)
         *
         * group: `indent`
         */
        uselessJassKeywords: /^(?<indent> *)(?:set|call|constant) +/gm,

        /**
         * JASS "$hexcode" must be converted to "0xhexcode" to work in Lua.
         *
         * group: `hex`
         */
        hexCodes: /\$(?<hex>[0-9a-fA-F]+\b[^$])/g,
        /**
         * find `name.reference`.
         *
         * `reference` can be either `name`, `execute` or `evaluate`.
         *
         * Also grabs any arguments passed to the executor or evaluator.
         *
         * Groups:
         *
         * `name`, `reference`, `hasArgs` and `args`
         */
        execEval:
            /(?<name>[\w$.]+)[:.](?<reference>name|(?:execute|evaluate))\b *(?<hasArgs>[(](?<args>[^()]*)[)])?/g,
        /**
         * Look for private|public type typeName extends ???
         */
        customType:
            /^(?<indent> *)(?:(?<scope>private|public) +)?type +(<?typeName>[\w$]+)(?<gap> +)extends(?<remainder>.*)/gm,
        array: /^[^[]*\[ *([^,\] ]+)[^•\r\n]*(.*)/m,
        /**
         * Capture `function` all the way to `endfunction`, capturing these groups:
         * indent: initial indent level
         * func: function name
         * params: list of parameters
         * rtype: return type of the function
         * contents: everything in-between the function...endfunction lines, including 'end' at the end.
         */
        fullFunction:
            /^(?<indent> *)(?<func>(?:[\w$:[\]=]+ +)+?|[^\r\n]*?\bfunction )\btakes +(?<params>[$\w, ]+ +)+?\breturns +(?<rtype>[$\w]+)(?<contents>.+?\bend)function\b/gms,
        // Extract `varName` from `varName = 10 + 20`
        variableAssignment: /(?<varName>[$\w]+) *=[^=\n\r•][^\n\r•]*/g,
        /**
         * Extract `takes unit u returns boolean` from `native UnitAlive takes unit u returns boolean` as `remainder`
         * Also captures the `indent` beforehand.
         */
        natives:
            /^(?<indent> *)(?:\bconstant\b)? *\bnative\b(?<remainder>[^•\r\n]+)/gm,

        /**
         * Capture groups:
         *
         * `rawName`: the name of the native.
         *
         * `rawGap`: the space between the name and args.
         *
         * `rawArgs`: the arguments of the native.
         *
         * `rawReturns`: The return type of the native.
         * `rawRemainder`: Anything after the return type; usually a comment if anything.
         */
        argsDeclaration:
            /(?<rawName>[$\w]+)(?<rawGap> +)takes +(?<rawArgs>[$\w, ]+ +)*?\breturns +(?<rawReturns>[$\w]+)(?<rawRemainder>.*?)/,
        /**
         * Capture groups: `firstChar`, `methodCaller`
         */
        methodCalls: /(?<firstChar>.)[.](?<methodCaller>[$\w.]+) *[(]/gm,
        /**
         * groups: `indent`, `typeName`, `baseType`, `size`
         */
        dynamicArrays:
            /^(?<indent> *)(?:private|public)* *type +(?<typeName>\w+) +extends +(?<baseType>\w+) +array *\[ *(?<size>\d+) *]/g,
        /**
         * groups: `indent`, `interfaceName`, `remainder`
         */
        interfaces:
            /^(?<indent> *)interface\b +(?<interfaceName>[$\w]+)(?<remainder>.*?)^ *endinterface/gm,
        /**
         * groups: `indent`, `scopeName`, `functionName`, `functionContents`
         */
        scopedFunctions:
            /^(?<indent> *)(?<scopeName>private|public +)(?:constant +)?function +(?<functionName>[$\w]+)(?<functionContents>.+?^ *endfunction)/gms,
        /**
         * groups: `indent`, `nativeName`, `proxyFuncName`
         */
        hooks: /^(?<indent> *)hook +(?<nativeName>\w+) +(?<proxyFuncName>[\w.]+)/gm,
        /**
         * groups: `local`, `remainder`
         */
        locals: /^(?<local> *local +)(?<remainder>.+)/gm,
    } as const;

    readonly singleCaptureGroup = {
        // Capture any non-tabs leading up to a line with tabs.
        tabs: /^([^\r\n\t]*)\t/gm,
        // extract the word `foo` from `function foo`.
        functionRef: /function *([$\w]+(?:[.][\w$]+)? *[),])/g,
        //static-if is a vJass compile-time optimization, which Lua doesn't have.
        // In this case, the capture group simply captures the leading indentation.
        staticIfs: /^( *)static +if\b/gm,
        lastDotInSeq: /\.([^.]*$)/,
        functionInterfaces: /^( *)(?:public|private)? *function interface/gm,
        vJassKeyword: /^( *)(?:public|private) +keyword\b/gm,
    } as const;
}

export const regexJass = new RegexJass();
