/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/src/**/*.spec.ts", "<rootDir>/test/**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          moduleResolution: "node",
          target: "ES2022",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
        },
        diagnostics: true,
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.spec.ts", "!src/main.ts"],
};
