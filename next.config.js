const { randomUUID } = require("node:crypto");

// Give each uploaded export fresh asset URLs, including unchanged shared chunks.
const deploymentVersion = randomUUID();

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    webpack(config, { dev }) {
        if (!dev) {
            config.output.hashSalt = deploymentVersion;
        }
        return config;
    },
};

module.exports = nextConfig;
