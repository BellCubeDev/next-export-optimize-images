const getRemoteImages = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(['https://picsum.photos/id/237/200/300.jpg', 'https://picsum.photos/id/238/200/300.jpg'])
    }, 500)
  })

/**
 * @type {import('../../src').Config}
 */
const config = {
  sharpOptions: {
    webp: {
      effort: 0,
    },
  },
  generateFormats: ['avif', 'webp'],
  remoteImages: getRemoteImages,
  filenameGenerator: ({ path, name, width, extension }) => `${path}/${name}_${width}.${extension}`,
  sourceImageParser: function ({ src, defaultParser }) {
    return defaultParser(src)
  },
  cacheDir: '.next/cache/next-export-optimize-images',
}

module.exports = config
