const fs = require('fs');
const tarfs = require('tar-fs');
const zlib = require('zlib');
const request = require('request');
const stream = require('stream');
const node_crypto = require('crypto');

var rand_name = function() {
  console.dir(process.versions);
  //name = Buffer.alloc(30);
  //node_crypto.randomFillSync(name); // electron is 1 minor version behind randomFillSync support
  var name = node_crypto.randomBytes(30);

  name = name.map((inp) => (inp % 52)).map((inp) => ((inp < 26)? (0x41 + inp) : (0x61 + inp - 26)));
  return name.toString();
}

var get_zip_pipe = function(filepath, exitStream) {
  return tarfs.pack(filepath).pipe(zlib.createGzip({level: zlib.Z_BEST_COMPRESSION})).pipe(exitStream);
}

var zip = function zip(filepath, filename = process.cwd() + "/" + rand_name() + '.tar.gz') {
  var input = get_zip_pipe(filepath, fs.createWriteStream(filename));
  return input;
}

var send_request = function(url, token, filename) {
  var form2 = {
    file: fs.createReadStream(filename),
    user_token: token
  };

  //var filePipe = tarfs.pack(filepath).pipe(zlib.createGzip());

  //filePipe.path = "something.tar.gz";

  //var form2 = {file: filePipe};
  //var form2 = {file: fs.createReadStream("output.tar.gz")};

  var settings = {
      method: 'POST',
      //preambleCRLF: true,
      //postambleCRLF: true,
      uri: url,
      formData: form2
    };

  return request(settings, function (error, response, body) {
      if (error) {
        return console.error('upload failed:', error);
      }
      if (response.statusCode !== 200) {
        return console.error('recieved error response. Code:', response.statusCode);
      }
      //console.log('Upload successful!  Server responded with:', body);
      fs.unlinkSync(filename);
    });
}

module.exports.get_zip_pipe = get_zip_pipe;
module.exports.zip = zip;
module.exports.send_request = send_request;
module.exports.rand_name = rand_name;
