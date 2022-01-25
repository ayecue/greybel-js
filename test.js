const minify = require('./out/web/minify').default;

(async () => {
    try {
        const output = minify('print("test")', {
            // @ts-ignore: Claims value is not defined
            uglify: false,
            // @ts-ignore: Claims value is not defined
            obfuscation: false,
            // @ts-ignore: Claims value is not defined
            disableLiteralsOptimization: false,
            // @ts-ignore: Claims value is not defined
            disableNamespacesOptimization: false,
            // @ts-ignore: Claims value is not defined
            excludedNamespaces: []
        });

        console.log(output);
    } catch (err) {
        console.error(err);
    }
})();