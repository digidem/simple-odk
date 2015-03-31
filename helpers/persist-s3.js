// Saves a String, Buffer or Stream to Amazon S3

var knox = require('knox')
var stream = require('stream')
var mime = require('mime-types')
var debug = require('debug')('simple-odk:persist-s3')

/**
 * Writes a file to Amazon S3
 * @param  {Stream|String|Buffer}   data     The file to write to Amazon S3
 * @param  {Object}   options  Required: `options.s3bucket` a valid S3 bucket name,
 * `options.file.size` filesize in bytes, needed by S3
 * @param  {Function} callback
 */
module.exports = function (data, options, callback) {
  if (!options.s3bucket) return callback(new Error('Need options.s3bucket'))
  if (!options.file) return callback(new Error('Need options.file'))
  if (!options.file.size) return callback(new Error('Need options.file.size'))
  if (!options.filename) return callback(new Error('Need options.file.filename'))

  debug('saving %s to bucket %s', options.filename, options.s3bucket)

  var s3Client = knox.createClient({
    key: options.s3key || process.env.S3_KEY,
    secret: options.s3secret || process.env.S3_SECRET,
    bucket: options.s3bucket
  })

  var headers = {
    'content-length': options.file.size,
    'content-type': options.file.headers['content-type'] || mime.lookup(options.filename),
    'cache-control': 'max-age=31536000'
  }

  var req = s3Client.put(options.filename, headers)

  req.on('error', callback)

  req.on('progress', function (w, t) {
    debug('uploading... %s of %s', w, t)
  })

  req.on('response', function (res) {
    if (res.statusCode === 200) {
      debug('wrote %s to %s', options.filename, req.url)
      callback(null, req.url)
    } else if (res.statusCode === 404) {
      callback(new Error('Bucket not found'))
    } else {
      callback(new Error('S3 Error'))
    }
  })

  if (data instanceof stream.Readable) {
    data.pipe(req)
  } else {
    req.end(data)
  }
}
