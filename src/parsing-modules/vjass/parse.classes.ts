import { ignoredKeywords, seekLineBreakR } from '../parseHelpers.ts';
import { parseVariable } from '../jass/parse.variable.ts';
import { IgnoredKeyword } from '../ignoredKeywords.ts';
import {
    find,
    regexStructs,
} from '../regular-expressions/struct-expressions.ts';

export const parseStructVar = (wholeMatch: string, w1: string, w2: string) => {
    if (
        ignoredKeywords.has(w1 as IgnoredKeyword) ||
        ignoredKeywords.has(w2 as IgnoredKeyword)
    ) {
        return wholeMatch;
    }
    return 'thistype.' + parseVariable(wholeMatch);
};

export const parseClasses = (classInput: string, baseIndent: string) =>
    classInput.replaceNamed(
        regexStructs.namedCaptureGroups.structs_or_modules,
        (captureGroups) => parseClass(captureGroups, baseIndent)
    );

const parseClass = (
    {
        classIndent,
        classScope = '',
        whichClass,
        className,
        classBody,
    }: Record<string, string | undefined>,
    baseIndent: string
) => {
    if (!classBody) {
        throw new Error('Regex Failed');
    }

    const linebreakPos = classBody.search(seekLineBreakR),
        isModule = whichClass === 'module';

    let classHeader = classBody.substring(0, linebreakPos);

    classBody = classBody
        .substring(linebreakPos)
        .replace(find.stubPrefixes, '')
        .replace(
            find.properties,
            (_, propIndent: string, propScope: string, propLine: string) => {
                if (propScope !== 'static') {
                    propLine = propLine.replace(find.static, '$1');
                }
                let isMethod = false;
                if (!isModule || propScope !== 'private') {
                    isMethod = propScope === 'method';
                    propScope = 'thistype'; //only keep 'private' for modules so the table knows to point to the module rather than to the implementing struct.
                }
                return (
                    propIndent +
                    (isMethod || propLine.startsWith('method')
                        ? propLine.replace(
                              find.method,
                              (_, methodName: string, methodEOL: string) =>
                                  methodName === 'operator'
                                      ? methodEOL.replace(
                                            find.operatorType,
                                            (
                                                _,
                                                isBracket: string,
                                                opName: string,
                                                isSetter: string,
                                                opEOL: string
                                            ) =>
                                                isBracket
                                                    ? isSetter
                                                        ? `function thistype:_setindex(${opEOL.replace(
                                                              find.operatorSet,
                                                              '$1, $2)'
                                                          )}`
                                                        : `function thistype:_getindex(${opEOL.replace(
                                                              find.operatorGet,
                                                              '$1)'
                                                          )}`
                                                    : isSetter
                                                    ? `thistype:_operatorset('${opName}', ${opEOL.replace(
                                                          find.operatorGet,
                                                          'function(self, $1)'
                                                      )})`
                                                    : `thistype:_operatorget('${opName}', function(self)`
                                        )
                                      : `function ${propScope}:${
                                            methodName + methodEOL
                                        }`
                          ) +
                          `\n${
                              propIndent + baseIndent
                          }local _ENV = Struct.environment(self)` //help Lua know when to pick up invisible 'self' references.
                        : `${propScope}.${parseVariable(propLine)}`)
                );
            }
        )
        .replace(find.operatorBodies, (operator) => `${operator})`)
        .replace(find.endmethods, 'endfunction');

    if (isModule) {
        classHeader = `vJass.module('${className}', '${classScope}', SCOPE_PREFIX, function(private, thistype)${classHeader}`;
        classBody += ')';
    } else {
        classHeader = `${className} = Struct() ---@class ${className}${
            classHeader ? ` --${classHeader}` : ''
        }`.replace(
            find.extends,
            (_, extended) => `(${extended !== 'array' ? extended : ''}) --`
        );
        if (classScope) {
            classHeader = 'local ' + classHeader;
            if (classScope === 'public') {
                classHeader += `\n${classIndent}_G[SCOPE_PREFIX..'${className}'] = ${className}`;
            }
        }
    }
    classBody = classBody
        .replace(find.these, 'self')
        .replace(find.isolatedDots, '$1self.$2')
        .replace(
            find.implements,
            `$1vJass.implement('$2', SCOPE_PREFIX, thistype)`
        )
        .repeatAction((vars) =>
            vars
                .replace(find.arrays, parseStructVar)
                .replace(find.variables, parseStructVar)
        )
        .replace(
            find.scopedStatics,
            (_, indent, scope) => `${indent + (scope || 'thistype')}.`
        );
    if (!isModule) {
        classBody = `do\n${classIndent + baseIndent}local thistype = ${
            className + classBody
        }`;
    }
    return classIndent + classHeader + '\n' + classIndent + classBody;
};
