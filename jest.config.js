const BASICS = {
    // *.node.test.ts(x) *.test.ts(x)
    testMatch: [
        "<rootDir>/src/**/*.node.test.(ts|tsx)",
        "<rootDir>/src/**/*.test.(ts|tsx)",
    ],
    preset: "ts-jest",
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
};

module.exports = {
    projects: [
        {
            displayName: "Node",
            testEnvironment: "node",
            ...BASICS,
        },
        {
            displayName: "Browser",
            testEnvironment: "jsdom",
            ...BASICS,
        },
        {
            displayName: {
                name: "Type",
                color: "white",
            },
            runner: "jest-runner-tsd",
            testMatch: ["**/*.test-d.ts"],
        },
    ],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                useESM: true,
            },
        ],
        "^.+\\.tsx$": [
            "ts-jest",
            {
                useESM: true,
            },
        ],
    },
    extensionsToTreatAsEsm: [".ts", ".tsx"],
    reporters: [
        "default",
        [
            "jest-html-reporters",
            {
                publicPath: "./reports/test",
                filename: "report.html",
                expand: true,
            },
        ],
    ],

    // Coverage
    collectCoverage: true,
    coverageDirectory: "./reports/coverage",
    coverageReporters: ["text", "lcov", "html"],
    coveragePathIgnorePatterns: ["/node_modules/", "/dist/"],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
        },
    },
};
