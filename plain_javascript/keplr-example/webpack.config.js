const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
    resolve: {
        fallback: {
          "fs": false,
          "tls": false,
          "net": false,
          "path": false,
          "zlib": false,
          "http": false,
          "https": false,
          "stream": false,
          "crypto": false, 
        } 
    },
    mode: 'development',
    entry: {
        main: "./src/main.js",
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname,  "dist")
    },
    devServer: {
        port: 8081
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "index.html",
            chunks: ["main"]
        })
    ]
};
