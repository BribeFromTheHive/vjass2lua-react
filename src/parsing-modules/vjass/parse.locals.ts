import { parsePostLocals, parsePreLocals } from './parse.vjass-misc.ts';
import { parseVariable } from '../jass/parse.variable.ts';
import { regexJass } from '../regular-expressions/jass-expressions.ts';

export const parseLocals = (script: string) => {
    script = parsePreLocals(script);

    script = script.replaceNamed(
        regexJass.namedCaptureGroups.locals,
        ({ local, remainder }) => {
            if (!local || !remainder) {
                throw new Error();
            }
            return local + parseVariable(remainder, true);
        }
    );

    return parsePostLocals(script);
};
