module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "extends": [
        "eslint:recommended",
        "airbnb-base",
        "plugin:security/recommended"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "prefer-destructuring": "off",
        "no-underscore-dangle": "off",
        "object-shorthand": "off",
        "consistent-return": "off",
        "linebreak-style": [ "error", "windows" ],
        "no-process-env": "off",
        "no-undef": "off",
        "func-names": "off",
        "quotes": "off",
        "comma-dangle": "off",
        "no-unused-vars": "off",
        "import/order": "off",
        "quote-props": "off",
        "no-trailing-spaces": "off",
        "no-var": "off",
        "prefer-template": "off",
        "prefer-arrow-callback": "off",
        "space-before-blocks": "off",
        "eqeqeq": "off",
        "vars-on-top": "off",
        "object-curly-spacing": "off",
        "no-shadow": "off",
        "space-before-function-paren": "off",
        "semi": "off",
        "keyword-spacing": "off",
        "spaced-comment": "off",
        "curly": "off",
        "nonblock-statement-body-position": "off",
        "no-lonely-if": "off",
        "max-len": "off",
        "space-infix-ops": "off",
        "space-in-parens": "off",
        "indent": "off",
        "no-console": "off",
        "no-else-return": "off",
        "arrow-body-style": "off",
        "no-param-reassign": "off",
        "no-tabs": "off",
        "prefer-const": "off",
        "arrow-parens": "off",
        "padded-blocks": "off",
        "no-extra-semi": "off",
        "template-curly-spacing": "off",
        "object-curly-newline": "off",
        "key-spacing": "off",
        "comma-spacing": "off",
        "array-bracket-spacing": "off",
        "no-multi-spaces": "off",
        "block-spacing": "off",
        "function-paren-newline": "off",
        "camelcase": "off",
        "no-use-before-define": "off",
        "array-callback-return": "off",
        "brace-style": "off"
    },
    "plugins": [
        "security"
    ]
};