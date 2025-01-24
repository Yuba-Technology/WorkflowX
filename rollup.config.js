const typescript = require("@rollup/plugin-typescript");
const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const pkg = require("./package.json");

// Check if it is in development mode (determined by the command line parameter -w)
const isDevelopment = process.argv.includes("-w");

// Automatically read dependencies from package.json
const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    // ...Object.keys(pkg.devDependencies || {}),
];

// Shared plugins
const plugins = [
    typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationMap: isDevelopment, // Only generate source map in development mode (rollup -w)
        declarationDir: "./dist",
    }),
    resolve({
        browser: true,
        preferBuiltins: true,
    }),
    commonjs(),
];

// Shared output configuration
const commonOutputConfig = {
    sourcemap: isDevelopment, // Only generate source map in development mode (rollup -w)
};

module.exports = [
    // CommonJs build (Node.js)
    {
        input: "src/index.ts",
        output: {
            file: pkg.main || "dist/index.js",
            format: "cjs",
            ...commonOutputConfig,
        },
        plugins,
        external,
    },
    // ES Module build (Node.js, modern browsers)
    {
        input: "src/index.ts",
        output: {
            file: pkg.module || "dist/index.esm.js",
            format: "es",
            ...commonOutputConfig,
        },
        plugins,
        external,
    },
];
