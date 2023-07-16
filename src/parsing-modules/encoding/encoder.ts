import { encodeComments, insertBlockComment } from './encodeComments.ts';
import { encodeStrings } from './encodeStrings.ts';
import { ConfigModel } from '../../Components/configurables/config.model.ts';

const find = {
    tabs: /^([^\r\n\t]*)\t/gm,
    novjassBlocks: /^ *\/\/! *novjass\b.*?^ *\/\/! *\bendnovjass\b/gms,
};

export const encoder = (
    script: string,
    spacing: number,
    config: ConfigModel,
) => {
    script = script
        .repeatAction(
            (str) =>
                str.replace(
                    find.tabs,
                    (_, leadingChars) => {
                        let len = leadingChars.length % spacing; //instead of zapping tabs to spacing...
                        len = spacing - len; //get the remaining length of tabs...
                        return leadingChars + ' '.repeat(len); //this preserves sub-indentation (such as when a user aligns = signs)
                    }, //example: 17 characters + a tab, the tab should be equal to 3 spaces...
                ), //17 mod 4 = 1, 4 - 1 = 3. That's our result.
        )
        .replace(find.novjassBlocks, (str) =>
            insertBlockComment(config, '\n' + str),
        );

    script = encodeStrings(config, script);
    return encodeComments(config, script);
};
