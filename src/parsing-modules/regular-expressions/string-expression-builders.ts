const rawVariable = '[$]?\\b[A-Za-z][\\w]*\\b[$]?';

export const regexFragment = {
    rawVariable,
    captureVariable: `(${rawVariable})`,
    lineBreak: '\\r?\\n',
    seekIndent: '^ *',
    captureToEOL: '(.*)',
    seekArray: ' *\\[ *(\\d+) *\\]',
} as const;
