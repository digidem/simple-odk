var traverse = require('traverse');

// Update references to media files to include links to the file stored on s3
function updateFileRef(form, file) {
    traverse(form).forEach(function(value) {
        if (file.originalFilename !== value) return;
        this.update({
            url: file.url,
            originalFilename: file.originalFilename
        }, true);
    });
}

module.exports = updateFileRef;
