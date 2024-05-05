import path from 'path'

import colors from 'ansi-colors'
import appRootPath from 'app-root-path'
import fs from 'fs-extra'
import type { NextConfig } from 'next'
import url from 'node:url'

import { Config } from './utils/getConfig'

const withExportImages = async (
  nextConfig: NextConfig = {},
  options: { __test?: boolean } = {}
): Promise<NextConfig> => {
  if (nextConfig.images?.unoptimized) {
    throw Error(
      'The `images.unoptimized` is not supported. If you use this option, consider not using `next-export-optimize-images`.'
    )
  }

  const resolvedConfigPath = path.join(process.cwd(), 'export-images.config.js')
  const existConfig = fs.existsSync(resolvedConfigPath)
  const destConfigPath = appRootPath.resolve('node_modules/next-export-optimize-images/export-images.config.js')

  let config: Config = {}
  if (existConfig) {
    const configSrc = import(url.pathToFileURL(resolvedConfigPath).toString()) as Config
    config = configSrc
    if (configSrc.remoteImages) {
      if (typeof configSrc.remoteImages === 'function') {
        config.remoteImages = await configSrc.remoteImages()
      }
    }
  }

  fs.ensureFileSync(destConfigPath)
  fs.writeFileSync(
    destConfigPath,
    `module.exports = ${JSON.stringify(
      config,
      (k, v) => {
        if (k === 'filenameGenerator' || k === 'sourceImageParser') {
          return v.toString()
        }
        return v
      },
      2
    )}`
  )

  // eslint-disable-next-line no-console
  console.log(
    colors.magenta(
      `info - [next-export-optimize-images]: ${
        fs.existsSync(resolvedConfigPath)
          ? `Configuration loaded from \`${resolvedConfigPath}\`.`
          : `Configuration was not loaded. (This is optional.)`
      }`
    )
  )

  const customConfig: NextConfig = {
    webpack(config, option) {
      const nextImageLoader = config.module.rules.find(
        ({ loader }: { loader?: string }) => loader === 'next-image-loader'
      )

      config.module.rules = [
        ...config.module.rules.filter(({ loader }: { loader?: string }) => loader !== 'next-image-loader'),
        {
          ...nextImageLoader,
          loader: undefined,
          options: undefined,
          use: [
            {
              loader: 'next-export-optimize-images-loader',
              options: {
                dir: path.join(process.cwd(), options.__test ? '__tests__/e2e' : ''),
                isDev: option.dev,
              },
            },
            { loader: nextImageLoader.loader, options: nextImageLoader.options },
          ],
        },
      ]

      config.resolveLoader.alias['next-export-optimize-images-loader'] = options.__test
        ? path.join(__dirname, 'loader')
        : 'next-export-optimize-images/dist/loader'

      return nextConfig.webpack ? nextConfig.webpack(config, option) : config
    },
  }

  return Object.assign({}, nextConfig, customConfig)
}

export default withExportImages
