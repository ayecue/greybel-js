module.exports = {
    "env": {
        "commonjs": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 12
    },
    "rules": {
        "no-prototype-builtins": "warn",
        "no-constant-condition": "off",
        "no-unused-vars": "warn",
        "no-self-assign": "off",
        "no-cond-assign": "off",
        "no-case-declarations": "off",
        "no-empty": "off"
    },
    "ignorePatterns": ["src/ui"],
    "globals": {
        "console": true,
        "process": true,
        "setTimeout": true,
        "__dirname": true,
        "Buffer": true,
        "document": true
    }
};
