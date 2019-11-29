require('tsconfig-paths').register({
    baseUrl: './dist',
    paths: require('./tsconfig.json').compilerOptions.paths,
});
