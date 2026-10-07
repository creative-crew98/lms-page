const { randomUUID } = require("node:crypto");
const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

const deploymentVersion = randomUUID();

/** @type {import('next').NextConfig} */
module.exports = (phase) => ({
    output: "export",
    // Running localhost must not overwrite files while a production export builds.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-development" : ".next",
    webpack(config, { dev }) {
        if (!dev) config.output.hashSalt = deploymentVersion;
        return config;
    },
});
