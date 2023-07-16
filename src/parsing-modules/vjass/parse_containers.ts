import { parseVariables } from '../jass/parse.variables.ts';

const find = {
    //indentation: ( *) ... name: (\w+) ... onInitName: (\w*) ... toEOL: ([^\r\n]*) ... contents: (.*?)
    libraries:
        /^( *)library +(\w+) *(?:initializer *(\w*))?([^\r\n]*)(.*?)endlibrary/gms,

    //indentation: ( *) ... nestedScope: (private|public)? ... name: (\w+) ... onInitName: (\w*) ... contents: (.*?)
    scopes: /^( *)(private|public)? *scope +(\w+) *(?:initializer *(\w*))?(.*?)endscope/gms,

    requireToEOL: /(?:requires|needs|uses) +(.*)/m,
    requirements: /(optional)? *(\w+)/g,
};

export const parseContainers = (containers: string, baseIndent: string) => {
    const parseContainer = (
        name: string,
        indentation: string,
        libraryProperties: string | undefined,
        nestedScopePrefix: string,
        contents: string,
        onInitName: string,
        baseIndent: string,
    ) =>
        `${indentation}OnInit(${
            libraryProperties ? `'${name}', ` : ''
        }function()${libraryProperties}\n${
            indentation + baseIndent
        }local SCOPE_PREFIX = ${nestedScopePrefix}'${name}_' ---@type string ${parseVariables(
            contents,
        )}${
            onInitName
                ? `${indentation + baseIndent}Require('Init vJass ${
                      libraryProperties ? 'Libraries' : 'Scopes'
                  }'); ${onInitName}()`
                : ''
        }\n${indentation}end)`;

    return containers
        .replace(
            find.libraries,
            (
                _,
                indentation = '',
                name = '',
                onInitName = '',
                toEOL?: string,
                contents = '',
            ) => {
                const libraryProperties = new Array<string>(),
                    addLibraryPropertyLine = (line: string) =>
                        libraryProperties.push(
                            '\n' + indentation + baseIndent + line,
                        );

                const matchToEOL = toEOL
                    ?.match(find.requireToEOL)?.[1]
                    ?.matchAll(find.requirements);

                if (matchToEOL) {
                    for (const [, isOptional, requirementName] of matchToEOL) {
                        addLibraryPropertyLine(
                            `Require${
                                isOptional ? '.optional' : ''
                            } '${requirementName}'`,
                        );
                    }
                }

                addLibraryPropertyLine(`LIBRARY_${name} = true`);

                return parseContainer(
                    name,
                    indentation,
                    libraryProperties.join(''),
                    '',
                    contents,
                    onInitName,
                    baseIndent,
                );
            },
        )
        .replace(
            find.scopes,
            (_, indentation, nestedScope, name, onInitName, contents) =>
                parseContainer(
                    name,
                    indentation,
                    '',
                    nestedScope ? 'SCOPE_PREFIX..' : '',
                    contents,
                    onInitName,
                    baseIndent,
                ),
        );
};
