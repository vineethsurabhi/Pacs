const stream = require("stream");
const fs = require("fs");

class Splitter extends stream.Writable {
  constructor(options) {
    super(options);

    this.sizeCallback = options.modifySize;

    this.maxSize = options.maxSize || (100 * 1024 * 1024);
    this.filepath = options.filepath || "./file";

    this.counter = 0;
    this.bytesWritten = 0;

    this.fileStream = fs.createWriteStream(this.filepath + ".part" + this.counter);
  }

  _write(chunk, encoding, callback) {
    this.fileStream.write(chunk, encoding);
    this.bytesWritten+=chunk.length;
    this.sizeCallback(chunk.length);

    if (this.bytesWritten >= this.maxSize) {
      this.bytesWritten = 0;
      this.counter++;
      this.fileStream.end();
      this.fileStream.on("finish", ()=> {
        callback(null);
      })
      this.fileStream = fs.createWriteStream(this.filepath + ".part" + this.counter);
      return;
    } else {
      callback(null);
    }
  }
}

module.exports = Splitter;
