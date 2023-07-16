import { parseVariable } from './parse.variable.ts';

const find = {
    globals: /^ *globals\b(.*?)\bendglobals\b/gms,
    privateConstants: /^(?<indent> *)private(?: +constant)*\b/gm,
    publicConstants:
        /^(?<indent> *)public +constant +(?<type>[$\w]+) +(?<name>[$\w]+)(?<rest>[^\n\r]*)/gm,
    publicVariables:
        /^(?<indent> *)public +(?<type>[$\w]+) +(?<name>[$\w]+)\b(?<rest>[^\n\r]*)/gm,
    localVariables: /^(?<indent> *(?<isLocal>local +)*)(?<remainder>.+)/gm,
};

const publicPrefix = '$<indent>local $<type> $<name>$<rest>\n$<indent>';

export const parseGlobals = (block: string) =>
    block.replace(find.globals, (_, globals: string) =>
        globals
            .replace(find.privateConstants, '$<indent>local')
            .replace(
                find.publicConstants,
                `${publicPrefix}_G[SCOPE_PREFIX.."$<name>"] = $<name>`,
            )
            .replace(
                find.publicVariables,
                `${publicPrefix}GlobalRemap(SCOPE_PREFIX.."$<name>", function() return $<name> end, function(val) $<name> = val end)`,
            )
            .replaceNamed(
                find.localVariables,
                ({ indent, isLocal, remainder }) =>
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    indent + parseVariable(remainder!, !!isLocal),
            ),
    );
