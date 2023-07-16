import { parseFunctions } from './jass/parse.functions.ts';
import { parseGlobals } from './jass/parse.globalsblock.ts';
import { parseLoops } from './jass/parse.loops.ts';
import { parseContainers } from './vjass/parse_containers.ts';
import { parseClasses } from './vjass/parse.classes.ts';
import { killSimpleJASSTokens } from './jass/killSimpleJassTokens.ts';
import { ConfigContextType } from '../ConfigContext.ts';
import { parseLocals } from './vjass/parse.locals.ts';
import { encoder } from './encoding/encoder.ts';
import { decoder } from './encoding/decoder.ts';
import { zincDispatcher } from './zinc/zincDispatcher.ts';

/**
 * Control the logical order in which code conversion takes place.
 * This is not necessarily the only order in which to do things, but the aim is to ensure that code isn't getting
 * parsed in the wrong context.
 * */
export const transcompile = (
    script: string,
    { spacing, config }: ConfigContextType,
) => {
    const baseIndent = ' '.repeat(spacing);

    script = encoder(script, spacing, config);

    script = zincDispatcher(script, config);
    script = killSimpleJASSTokens(script, config);
    script = parseLocals(script);
    script = parseContainers(script, baseIndent);
    script = parseLoops(script, config);
    script = parseGlobals(script);
    script = parseClasses(script, baseIndent);
    script = parseFunctions(script, config);

    script = decoder(script);

    if (config.autoCopy) {
        navigator.clipboard.writeText(script).catch(console.error);
    }
    return script;
};
