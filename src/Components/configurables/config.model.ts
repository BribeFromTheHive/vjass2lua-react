export const configOptions = {
    autoConvert: {
        label: 'Convert on paste',
        defaultValue: true,
    },
    autoCopy: {
        label: 'Copy on convert',
        defaultValue: true,
    },
    commentDebug: {
        label: 'Comment-out debug lines',
        defaultValue: true,
    },
    deleteComments: {
        label: 'Delete comments',
        defaultValue: false,
    },
    deleteEmmy: {
        label: 'Delete Emmy Annotation',
        defaultValue: false,
        change: 'onDeleteEmmy()',
    },
    shouldDeleteLineBreaks: {
        label: 'Delete extra linebreaks',
        defaultValue: false,
        change: 'deleteLineBreaks()',
    },
    avoidRepeatUntil: {
        label: "Don't use repeat...until loops",
        defaultValue: false,
    },
    deleteNatives: {
        label: 'Comment-out native declarations',
        defaultValue: true,
    },
    useAlias: {
        label: 'Use @type one-liner instead of multi-line @param',
        defaultValue: true,
    },
} as const;

export type ConfigOptionKey = keyof typeof configOptions;
export type ConfigModel = { [K in ConfigOptionKey]: boolean };

export const configOptionKeys = Object.keys(configOptions) as ConfigOptionKey[];

export const configModel = Object.fromEntries(
    configOptionKeys.map((key) => [key, configOptions[key].defaultValue]),
) as ConfigModel;
