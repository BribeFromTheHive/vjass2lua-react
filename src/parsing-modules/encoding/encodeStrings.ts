import { pack } from './encoderModel.ts';
import { ConfigModel } from '../../Components/configurables/config.model.ts';

const find = {
    postConcat: /" *\+/g,
    preConcat: /\+ *"/g,
    strings: /"(?:[^"\\]|\\"|\\[\\\w])*?"/gm,
    rawCodes: /'(?:[^'\\]|\\'|\\\\){4}'/g, //Wraps stuff like 'hfoo' or 'Abil' in FourCC.
};

export const encodeStrings = (config: ConfigModel, mainParsedStr: string) =>
    mainParsedStr
        .replace(find.postConcat, '"..')
        .replace(find.preConcat, '.."')
        .replace(find.strings, (str) => pack.encode.string(config, str))
        .replace(find.rawCodes, (str) =>
            pack.encode.rawcode(config, `FourCC(${str})`),
        );
