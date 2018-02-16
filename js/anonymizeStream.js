const fs = require("fs");
const path = require("path");

const stream = require("stream");
const tar = require("tar-stream");

const anonymize = require("./anonymize.js");

class Anonymize extends stream.Readable {

	constructor(options) {

		super(options);
		this.filepath = options.filepath;
		this.files = flatten_filetree(this.filepath);
		this.map = options.map;
		this.fileIndex = 0;
		this.dbhandle = options.dbhandle;
		this.anonymizer = anonymize.init(options, this.dbhandle);
		this.packStream = tar.pack();

	}

	_read() {

		if (this.fileIndex < this.files.length) {
			let fileBuffer = fs.readFileSync(this.files[this.fileIndex]);
			this.map({size:fs.lstatSync( this.files[this.fileIndex])});
			let anonymizedData = this.anonymizer(fileBuffer);
			let folderpath = path.relative(this.filepath,this.files[this.fileIndex]);
			this.packStream.entry({name:folderpath},anonymizedData);
			let filedata = this.packStream.read();
			this.push(filedata);
			this.fileIndex++;

		} else {

			this.push(null);
		}
	}
}

function flatten_filetree (dir, files_){
	files_ = files_ || [];
	let files = fs.readdirSync(dir);
	for (var i in files){
		let name = dir + "/" + files[i];
		if (fs.statSync(name).isDirectory()){
			flatten_filetree(name, files_);
		} else {
			files_.push(name);
		}
	}
	return files_;
}
module.exports = Anonymize;


