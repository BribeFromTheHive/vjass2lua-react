import { pack } from './encoderModel.ts';
import { ConfigModel } from '../../Components/configurables/config.model.ts';

export const insertBlockComment = (config: ConfigModel, comment: string) =>
    pack.encode.comment(config, `[[${comment}]]`);

const find = {
    preprocessors: /^([^/]?)\/\/!/gm,
    comments: /\/\/(?<comment>.*)/g,
    safeBlockComments:
        /\/\*(?<comment>(?:(?!\*\/).)*?)\*\/(?<trailingText> *•.*?)*$/gms, //convert safe block comments that don't have trailing text at the end
    riskyBlockComments:
        /(?<leadingText>[;}] *)\/\*(?<comment>(?:(?!\*\/).)*?)\*\//gms, //convert safe block comments that were preceded by a semicolon or closing curly bracket.
    unsafeComments: /\/\*(?:(?!\*\/).)*?\*\//gms,
};

export const encodeComments = (config: ConfigModel, mainParsedStr: string) =>
    mainParsedStr
        .replace(find.preprocessors, '$1--!')
        .replaceNamed(find.comments, ({ comment = '' }) =>
            pack.encode.comment(config, comment),
        )
        .replaceNamed(
            find.safeBlockComments,
            ({ comment = '', trailingText = '' }) =>
                insertBlockComment(config, comment) + trailingText,
        )
        .replaceNamed(
            find.riskyBlockComments,
            ({ leadingText = '', comment = '' }) =>
                leadingText + insertBlockComment(config, comment),
        )
        .replace(find.unsafeComments, '');
