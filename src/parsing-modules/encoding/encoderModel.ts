import { ConfigModel } from '../../Components/configurables/config.model.ts';

type PackageType = (typeof packageConfigurations)[number]['whichType'];

type PackageCode<T> = { [key in PackageType]: T };

export const pack = {
    encode: {} as PackageCode<(config: ConfigModel, str: string) => string>,
    decode: {} as PackageCode<(str: string) => string>,
} as const;

const packageConfigurations = [
    { whichType: 'comment', encoding: 'cmt' },
    { whichType: 'string', encoding: 'str' },
    { whichType: 'rawcode', encoding: 'fcc' },
    { whichType: 'zinc', encoding: 'znc' },
    { whichType: 'zincfunc', encoding: 'fun' },
    { whichType: 'zincstruct', encoding: 'zst' },
    { whichType: 'zincvar', encoding: 'zvr' },
    { whichType: 'zincpublic', encoding: 'pub' },
] as const;

for (const { whichType, encoding } of packageConfigurations) {
    const array = new Array<string>();
    const code = `${
        ['string', 'rawcode'].includes(whichType) ? '`' : '•'
    }#${encoding}#`;

    pack.encode[whichType] = (config: ConfigModel, str: string) => {
        if (whichType === 'comment') {
            if (config.deleteComments) {
                return '';
            }
            str = `--${str}`;
        } /*else {
            switch (whichType) {
                case 'Zinc': case 'ZincStruct': case 'ZincFunc':
                    console.log(str);
            }
        }*/
        return code + (array.push(str) - 1);
    };

    const finder = new RegExp(`${code}(\\d+)`, 'g');

    pack.decode[whichType] = (str: string) => {
        if (array.length) {
            return str.replace(finder, (_, num: string) => array[+num]);
        }
        return str;
    };
}
