import { ConfigModel } from '../../Components/configurables/config.model.ts';

const find = {
    loops: /^(?<indent> *)(\bloop\b(?:(?!\bendloop\b|\bloop\b).)*\bendloop\b)/gms,
    whileNotCandidates:
        /^loop\s+exitwhen *(?<conditionLine>[^\r\n•]*)(?<toEndOfLoop>.*end)loop/ms,
    comparison: /^ *([\w$]+) *(?<comparison>[<>=~]{1,2}) *([\w$]+) *$/m,
    repeatUntilCandidate:
        /^loop(?<body>.*)\r?\n *exitwhen(?<conditionLine>[^\n\r•]*)(?<trailingWhitespace>\s*? *)endloop/ms,
    basicLoop: /^loop\b(?<body>.*)endloop/ms,
    basicExitwhens: /^(?<indent> *)exitwhen\b(?<conditionLine>[^\r\n•]*)/gm,
    exitwhenTrues: /^\bif *true *then break end\b/gm,
} as const;

const invertedOperatorsMap = {
    '<': '>=',
    '>': '<=',
    '<=': '>',
    '>=': '<',
    '~=': '==',
    '==': '~=',
} as const;

export const parseLoops = (loops: string, config: ConfigModel) => {
    const repeatUntilReplacement = config.avoidRepeatUntil
        ? '$&'
        : 'repeat$<body>$<trailingWhitespace>until$<conditionLine>';
    return loops.repeatAction((loops) => {
        return loops.replace(find.loops, (_, indent: string, loop: string) =>
            loop
                .replace(
                    find.whileNotCandidates,
                    (_, conditionLine: string, toEndOfLoop: string) => {
                        const prevConditionLine = conditionLine;
                        conditionLine = conditionLine.replace(
                            find.comparison,
                            (
                                _,
                                w1: string,
                                comparison: keyof typeof invertedOperatorsMap,
                                w2: string,
                            ) =>
                                `${w1} ${invertedOperatorsMap[comparison]} ${w2}`,
                        );
                        return `${indent}while ${
                            conditionLine !== prevConditionLine ? '' : 'not '
                        }(${conditionLine}) do ${toEndOfLoop}`;
                    },
                )
                .replace(
                    find.repeatUntilCandidate,
                    indent + repeatUntilReplacement,
                )
                .replace(find.basicLoop, indent + 'while true do$<body>end')
                .replace(
                    find.basicExitwhens,
                    '$<indent>if$<conditionLine> then break end',
                )
                .replace(find.exitwhenTrues, 'break'),
        );
    });
};
