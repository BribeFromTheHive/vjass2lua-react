import { pack } from '../encoding/encoderModel.ts';
import { parseNatives } from '../jass/parse.natives.ts';
import { ConfigModel } from '../../Components/configurables/config.model.ts';

const find = {
    luaKeywords: /\b(?:do|in|end|nil|repeat|until)\b/g, //These aren't found in vJass nor Zinc.
    nulls: /\bnull\b/g,
    notEquals: /!=/g,
    valueKeys: /([\w$]+):([\w$]+)/g, //this is vJass val:key syntax that needs to get converted to key[val] for Lua.
    loopKeywords: /\b(?:for|break|while)\b/g, //fix Lua keywords that aren't found in JASS but are found in Zinc.
} as const;

export const zincDispatcher = (script: string, config: ConfigModel) => {
    //Convert stuff that is common between Zinc and vJass.
    script = script
        .replace(find.luaKeywords, '$&_')
        .replace(find.nulls, 'nil')
        .replace(find.notEquals, '~=')
        .replace(find.valueKeys, '$2[$1]');

    //script = parseZinc(script);

    //Parse stuff here that would break logic if it were parsed while Zinc were still included.
    script = parseNatives(script, config); //todo: check if Zinc was able to declare natives, and parse them separately.
    script = script.replace(find.loopKeywords, '$&_');

    return pack.decode.zinc(script);
};
