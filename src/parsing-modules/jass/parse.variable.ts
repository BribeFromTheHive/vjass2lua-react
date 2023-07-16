import { convertJASSTypeToLua } from '../parseHelpers.ts';
import { addToIntStack } from './parse.variables.ts';
import { captureVariable } from '../vjass/parse.vjass-misc.ts';

const seekIndent = '^ *',
    captureToEOL = '(.*)',
    seekArray = ' *\\[ *(\\d+) *\\]',
    find = {
        arrayDeclaration: new RegExp(
            `${seekIndent + captureVariable} +array +${
                captureVariable + captureToEOL
            }`,
            'm',
        ),
        twoDimensionalArray: new RegExp('^' + seekArray + seekArray, 'm'),
        standardArray: new RegExp('^' + seekArray, 'm'),
        standardVariable: new RegExp(
            `${seekIndent + captureVariable}( +)${
                captureVariable + captureToEOL
            }`,
            'm',
        ),
    };

export const parseVariable = (line: string, isLocal = false) => {
    //check for array declarations, first
    const newLine = line.replace(
        find.arrayDeclaration,
        (_, type: string, name: string, remainder: string) => {
            //let tlen = ' '.repeat(type.length) + '      '; //##formatting
            const rawType = type;
            type = ' ---@type ' + convertJASSTypeToLua(type);
            let result = remainder.replace(
                find.twoDimensionalArray,
                (_, width, height) =>
                    `${name}=vJass.array2D(${width}, ${height})${type}[][] `,
            );
            type += '[]';
            if (result === remainder) {
                result = remainder.replace(
                    find.standardArray,
                    (_, size) => `${name}={size=${size}}${type} `,
                );
                if (result === remainder) {
                    let arrayType;
                    switch (rawType) {
                        case 'integer':
                            addToIntStack(name); // fall through
                        case 'number':
                            arrayType = '0';
                            break;
                        case 'boolean':
                            arrayType = 'false';
                            break;
                        case 'string':
                            arrayType = "''";
                            break;
                        default:
                            arrayType = '{}';
                    }
                    if (arrayType !== '{}') {
                        arrayType = `__jarray(${arrayType})`;
                    }
                    result = `${name}=${arrayType + type} ${remainder}`;
                }
            }
            return result;
        },
    );
    if (newLine !== line) {
        return newLine; //array has been parsed
    }
    return line.replace(
        find.standardVariable,
        (_, type, tlen, name, remainder) => {
            let tail = '';
            const hasComment = remainder.search(/•/);
            tlen += ' '.repeat(type.length);
            if (hasComment >= 0) {
                tail = remainder.substring(hasComment);
                remainder = remainder.substring(0, hasComment);
            }
            if (type === 'integer') {
                addToIntStack(name);
            } else if (type === 'key') {
                remainder = '=vJass.key()' + remainder;
                type = 'integer';
                tlen = '';
            }

            tail = ' ---@type ' + convertJASSTypeToLua(type) + ' ' + tail;
            const isSet = remainder.search(/^ *=/m);
            if (isSet < 0) {
                if (isLocal) return name + tail; //local variable declaration does not need assignment.

                return name + '=nil' + tail; //global variable declaration needs assignment to be valid syntax.
            }
            return name + tlen + remainder + tail; //variable with assignment has been parsed
        },
    );
};
