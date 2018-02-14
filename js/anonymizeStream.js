const stream = require("stream");
const fs = require("fs");
const path = require("path");
const anonymize = require("./anonymize.js");
const tar = require('tar-stream');
const dicomParser = require('dicom-parser');
const dir = require('node-dir');


class Anonymize extends stream.Readable {

    constructor(options) {

        super(options);
        this.filepath = options.filepath;
        this.files = getFiles(this.filepath);
        this.map = options.map;
        this.fileIndex = 0;
        this.dbhandle = options.dbhandle;
        this.anonymizer = anonymize.init(options, this.dbhandle);
        this.packStream = tar.pack();

    }

    _read(size) {

        if (this.fileIndex < this.files.length) {
            let fileBuffer = fs.readFileSync(this.files[this.fileIndex]);
            this.map({size:fs.lstatSync( this.files[this.fileIndex])});
            let anonymizedData = this.anonymizer(fileBuffer);
            let originalstring = this.files[this.fileIndex];
            let splitstring= originalstring.split(path.sep);
            this.packStream.entry({name:splitstring[splitstring.length-2]+path.sep+splitstring[splitstring.length-1]},anonymizedData);
            let filedata = this.packStream.read();
            this.push(filedata);
            this.fileIndex++;

        } else {

                this.push(null);
                }
    };
}
function getFiles (dir, files_){
    files_ = files_ || [];
    let files = fs.readdirSync(dir);
    for (var i in files){
        let name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}
module.exports = Anonymize;


