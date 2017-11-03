const fs = require('fs');
const tarfs = require('tar-fs');
const zlib = require('zlib');
const request = require('request');
const stream = require('stream');
const node_crypto = require('crypto');
const os = require('os');
const path = require('path');
const getFolderSize = require('get-folder-size');

var init = function(zip_cb, upload_cb, error_cb, progressObject) {
  var fns = {};
  var tar_zip_stream;
  var file_stream;
  var zipStart;
  var uploadStart;

  var rand_name = function() {
    var name = node_crypto.randomBytes(30);

    name = name.map((inp) => (inp % 52)).map((inp) => ((inp < 26)? (0x41 + inp) : (0x61 + inp - 26)));
    return name.toString();
  }

  var get_zip_pipe = function(filepath, exitStream) {
    var cbid = setInterval(zip_cb, 1000, progressObject);
    zipStart = new Date();

    var calculating = true;

    getFolderSize(filepath, (err, size)=>{
      if (err) throw err;

      console.log("folder size found: ", size);

      calculating = false;
      progressObject.total_size = size;
    })

    return tarfs.pack(filepath, {
      map: function(header) {
        //console.log(header);
        if(calculating)
        progressObject.total_size += header.size;
      },
      finish: function() {
        console.log("closed");
        clearInterval(cbid);
      }
    })
    .on('data', (chunk)=> {
      progressObject.bytes_read += chunk.length;
      progressObject.rate = ((progressObject.bytes_read/(1024*1024))/((new Date() - zipStart)/1000))
      progressObject.eta = (progressObject.total_size - progressObject.bytes_read)/ (progressObject.rate * 1024 * 1024);
    })
    .pipe(zlib.createGzip({level: zlib.Z_BEST_COMPRESSION})).pipe(exitStream);
  }

  var zip = function zip(filepath, filename = path.join(os.tmpdir(), rand_name() + '.tar.gz')) {
    var input = get_zip_pipe(filepath, fs.createWriteStream(filename));
    return input;
  }

  var send_request = function(url, token, filename) {
    var cbid = setInterval(upload_cb, 1000, progressObject);
    uploadStart = new Date();

    progressObject.bytes_read = 0;
    var calculating = true;
    fs.stat(filename, (err, stat)=> {
      calculating = false;
      progressObject.total_size = stat.size;
      //console.log("stat size:", progressObject.total_size);
    })
    var readStream = fs.createReadStream(filename)
    .on('data', (chunk)=>{
      progressObject.bytes_read += chunk.length;
      progressObject.rate = ((progressObject.bytes_read/(1024*1024))/((new Date() - uploadStart)/1000))
      progressObject.eta = (progressObject.total_size - progressObject.bytes_read)/ (progressObject.rate * 1024 * 1024);
    });
    var form2 = {
      file: readStream,
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
          console.error('upload failed:', error);
          error_cb(error);
          return;
        }
        if (response.statusCode !== 200) {
          console.error('recieved error response. Code:', response.statusCode, '. Retrying now.');
          request(settings, function(error, response, body) {
            if (response.statusCode != 200) {
              error_cb();
            }

            clearInterval(cbid);
            fs.unlinkSync(filename);
          });
          return;
        }
        //console.log('Upload successful!  Server responded with:', body);
        clearInterval(cbid);
        fs.unlinkSync(filename);
      });
  }


  fns.get_zip_pipe = get_zip_pipe;
  fns.zip = zip;
  fns.send_request = send_request;
  fns.rand_name = rand_name;

  return fns;
}

module.exports = init;
