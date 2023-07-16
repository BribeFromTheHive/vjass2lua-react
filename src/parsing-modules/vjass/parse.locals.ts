import { parsePostLocals, parsePreLocals } from './parse.vjass-misc.ts';
import { parseVariable } from '../jass/parse.variable.ts';

const find = {
    locals: /^(?<local> *local +)(?<line>.+)/gm,
} as const;

export const parseLocals = (script: string) => {
    script = parsePreLocals(script);

    script = script.replaceNamed(find.locals, ({ local, line }) => {
        if (!local || !line) {
            throw new Error();
        }
        return local + parseVariable(line, true);
    });

    return parsePostLocals(script);
};
