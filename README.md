ODK Aggregate for Node.js
=============

This is a minimal server for [OpenDataKit (ODK)](http://www.opendatakit.org/) that uses [Github](http://github.com/) and Amazon S3 or the filesystem for storing forms and plain text files. It can receive form submissions from ODK Collect. Authentication is passed through to Github - you will need to enter your github username and password in ODK Collect.

You need to set up various environment variables for configuration. By default forms are stored locally in a folder `form_data` in the same folder as the app.

`MEDIA_STORE` `s3` or `fs`

`FORM_STORE` `github` or `s3` or `fs`

`S3_BUCKET` Your Amazon S3 bucket name

`S3_KEY` Your Amazon S3 key (only required if MEDIA_STORE=s3)

`S3_SECRET` Your Amazon S3 secret

`ACCEPT_CONTENT_LENGTH` The maximum size of form submission (defaults to 10485760)

`GITHUB_USER` Github username for the owner of the repo where the form submissions will be stored

`GITHUB_REPO` Repo name for form submissions

`GITHUB_BRANCH` Branch name on Github (defaults to `master`)

`FILE_PATH` Local folder to store form submissions (defaults to `form_data` in the app folder)

`FORM_SERVER` OpenRosa form server for blank forms (defaults to folder `forms` in the github repo for form submissions)
