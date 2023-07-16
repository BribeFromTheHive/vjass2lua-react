import { pack } from './encoderModel.ts';

export const decoder = (script: string) => {
    script = script.repeatAction(pack.decode.comment);
    script = pack.decode.string(script);
    return pack.decode.rawcode(script);
};
