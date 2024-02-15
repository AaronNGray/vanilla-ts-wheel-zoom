import typescript from '@rollup/plugin-typescript';
import {generateDtsBundle} from 'rollup-plugin-dts-bundle-generator';

export default {
    input: 'src/wheel-zoom.ts',
    output: [
      {
        file: 'dist/wheel-zoom.js',
        format: 'umd',
        name: 'WZoom'
      },
      {
        file: 'dist/wheel-zoom.mjs',
        format: 'esm'
      }
    ],
    plugins: [
        typescript({}),
        generateDtsBundle({})
    ],
    watch: {
        exclude: 'node_modules/**',
        clearScreen: false,
        chokidar: {
            usePolling: true
        }
    }
};
