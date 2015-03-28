Simple ODK
=============

[![travis][travis-image]][travis-url]
[![npm][npm-image]][npm-url]
[![downloads][downloads-image]][downloads-url]
[![js-standard-style][style-image]][style-url] 
[![donate][gratipay-image]][gratipay-url]

[travis-image]: https://img.shields.io/travis/digidem/simple-odk.svg?style=flat
[travis-url]: https://travis-ci.org/digidem/simple-odk
[npm-image]: https://img.shields.io/npm/v/simple-odk.svg?style=flat
[npm-url]: https://npmjs.org/package/simple-odk
[downloads-image]: https://img.shields.io/npm/dm/simple-odk.svg?style=flat
[downloads-url]: https://npmjs.org/package/simple-odk
[style-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[style-url]: https://github.com/feross/standard
[gratipay-image]: https://img.shields.io/gratipay/Digital%20Democracy.svg
[gratipay-url]: https://gratipay.com/Digital%20Democracy/

**Currently experimental, things will change and potentially break**

This is a minimal server for [OpenDataKit (ODK)](http://www.opendatakit.org/) that uses [Github](http://github.com/) for storing form submissions as geojson files, and media files on [Amazon S3](http://aws.amazon.com/s3/). It can receive form submissions from ODK Collect. Authentication is passed through to Github - you will need to enter your github username and password in ODK Collect.

The Github repo for form storage is defined by the url used in ODK Collect: `http://simpleodk.org/:user/:repo/` where `:user` is your github username and `:repo` is the github repo where you would like to store the form submissions. The Github user authenticaed with ODK Collect must have write access to this repo.

The Amazon S3 bucket used for storage is also derived from the url, of the form `simpleodk.user.repo`. You will need to provide `S3_KEY` and `S3_SECRET` via environment variables for a user that has `S3:PutObject` and `S3:PutObjectAcl` permissions on the bucket. If you do not submit any photos / media files with the forms, you do not need an S3 bucket.

This is like [Jekyll](http://jekyllrb.com/) - using static files for data. It avoids needing to maintain a database and it means we always have access to the raw data, even if servers go down (unless github goes down, of course, but then the whole web is in trouble).
