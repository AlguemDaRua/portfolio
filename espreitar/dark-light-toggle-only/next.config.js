/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  allowedDevOrigins: ["*.e2b.app"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

module.exports = nextConfig;
