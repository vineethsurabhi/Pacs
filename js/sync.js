const fs = require('fs');
const tarfs = require('tar-fs');
const zlib = require('zlib');
const request = require('request');
const stream = require('stream');
const node_crypto = require('crypto');
const os = require('os');
const path = require('path');
const getFolderSize = require('get-folder-size');
const Splitter = require('./splitter.js')

function hash_name(filepath) {
    var name = path.basename(filepath).toLowerCase();
    var md5 = node_crypto.createHash("md5");
    md5.update(name);

    var hash = md5.digest().toString('hex');
    return hash;
}

function rand_name() {
    var name = node_crypto.randomBytes(30);

    name = name.map((inp) => (inp % 52)).map((inp) => ((inp < 26) ? (0x41 + inp) : (0x61 + inp - 26)));
    return name.toString();
}

function init(options) {
    var zipStart;
    var file = null;
    var filepath = options.filepath;
    var token = options.token;
    var uploadStart;
    var manifest = {
        ready: false,
        tries_left: 5,
        files: [],
        files_total_size: 0
    };
    var log = options.logObject;

    if (!fs.statSync(filepath).isDirectory()) {
        log.info('Check if the uploaded study is a directory');
        file = path.basename(filepath);
        filepath = path.dirname(filepath);
    }

    var filename = path.join(os.tmpdir(), hash_name(filepath) + '.tar.gz');

    if (fs.existsSync(filename + ".manifest.json")) {
        log.info('Checking for existing manifest file');
        console.log("Trying to resume");
        manifest = require(filename + ".manifest.json");

        if (manifest.tries_left == 0) {
            log.info('Removing manifest file');
            fs.unlinkSync(filename + ".manifest.json")
            manifest = {
                ready: false,
                tries_left: 5,
                files: [],
                files_total_size: 0
            }
        }
    }

    function get_zip_pipe() {
        zipStart = new Date();
        var calculating = true;
        var cbid = setInterval(options.zip_cb, 1000, options.progressObject);

        getFolderSize(filepath, (err, size) => {
            if (err) throw err;
            log.info('Folder size found' + size);
            console.log("folder size found: ", size);

            calculating = false;
            options.progressObject.total_size = size;
        });

        var splitter = new Splitter({
            filepath: filename,
            maxSize: 50 * 1024 * 1024,
            modifySize: function(size) {
                manifest.files_total_size += size;
            }
        });

        var pack = tarfs.pack(filepath, {
                entries: file ? [file] : undefined,
                map: function(header) {
                    //console.log(header);
                    if (calculating)
                        options.progressObject.total_size += header.size;
                },
                finish: function(stream) {
                    console.log("closed");
                    log.info('Successfully zipped study');
                    // console.log("closed");
                    clearInterval(cbid);
                }
            })
            .on('data', (chunk) => {
                options.progressObject.bytes_read += chunk.length;
                options.progressObject.rate = ((options.progressObject.bytes_read / (1024 * 1024)) / ((new Date() - zipStart) / 1000))
                options.progressObject.eta = (options.progressObject.total_size - options.progressObject.bytes_read) / (options.progressObject.rate * 1024 * 1024);
            })
            .pipe(zlib.createGzip({ level: zlib.Z_BEST_COMPRESSION }))
            .pipe(splitter);

        options.cancel_cb(() => {
            pack.cork();
            splitter.cork();
            log.info('Attempting to delete compression stream');
            clearInterval(cbid);
        });

        return pack;
    }

    function send_request(url, token, filename, callback) {
        var cbid = setInterval(options.upload_cb, 1000, options.progressObject);
        uploadStart = new Date();

        var calculating = true;
        options.progressObject.total_size = manifest.files_total_size;

        var readStream = fs.createReadStream(filename)
            .on('data', (chunk) => {
                options.progressObject.bytes_read += chunk.length;
                options.progressObject.rate = ((options.progressObject.bytes_read / (1024 * 1024)) / ((new Date() - uploadStart) / 1000))
                options.progressObject.eta = (options.progressObject.total_size - options.progressObject.bytes_read) / (options.progressObject.rate * 1024 * 1024);
            });

        var form = {
            file: readStream,
            user_token: token
        };

        var settings = {
            method: 'POST',
            uri: url,
            formData: form
        };

        var tries_left = 5;

        var req;

        function request_cb(error, response, body) {
            if (error) {
                console.error("upload failed:", error);
                log.error('Error uploading study :' + error);
                options.error_cb(error);
                tries_left--;
                if (tries_left) {
                    req = request(settings, request_cb);
                } else {
                    clearInterval(cbid);
                    options.abort_cb();
                }
                return;
            } else if (response.statusCode !== 200) {
                log.error(`Error uploading file ${response.statusCode}, Retrying`);
                console.error(`recieved error response. Code:${response.statusCode}. Retrying now.`);
                options.error_cb(new Error(`recieved error response. Code:${response.statusCode}. Retrying now.`));                
                tries_left--;
                if (tries_left) {
                    req = request(settings, request_cb);
                } else {
                    clearInterval(cbid);
                    options.abort_cb();
                }
                return;
            }
            console.log(body);
            manifest.files.push(body);
            clearInterval(cbid);
            callback();
        }

        req = request(settings, request_cb);

        return req;
    }

    function upload() {
        var req;
        if (manifest.ready) {
            log.info("Resuming upload session");
            console.log("resuming");
            start_sending();
        } else {
            var pack = get_zip_pipe();
            log.info("No previous manifest files found, starting a new upload");
            console.log("No previous manifest files found, starting a new upload");
            pack.on("finish", start_sending);
        }

        function start_sending() {
            log.info('Finished splitting');
            console.log('Finished splitting');
            var abort = false;
            options.cancel_cb(() => {
                abort = true;
                req.abort();
                request({
                    method: 'POST',
                    uri: "https://liver.prediblehealth.com/remove_upload",
                    formData: {
                        user_token: token,
                        file_list: manifest.files.join(",")
                    }
                }, function() {
                    log.info('Sending cancel request to API server');
                    console.log('cancelled');
                });
            });
            manifest.ready = true;
            manifest.count = (manifest.count || this.counter);
            console.log(JSON.stringify(manifest));
            fs.writeFileSync(filename + ".manifest.json", JSON.stringify(manifest), { encoding: "utf-8" });
            options.progressObject.parts = (this.counter || manifest.count) + 1;
            options.progressObject.bytes_read = 0;
            options.progressObject.total_size = manifest.files_total_size;
            var counter = 0;
            console.log(counter, " parts");
            next();


            function next() {
                if (abort) {
                    return;
                }
                if (counter == options.progressObject.parts) return send_manifest(5);
                console.log("sending part ", counter + 1);
                options.progressObject.part = counter + 1;
                req = send_request("https://liver.prediblehealth.com/upload_part", token, filename + ".part" + counter, next);
                log.debug(`Study part ${counter+1} being sent`);
                counter++;
            }

            function send_manifest(tries_left) {
                request({
                    method: 'POST',
                    uri: "https://liver.prediblehealth.com/complete_upload",
                    formData: {
                        user_token: token,
                        file_list: manifest.files.join(",")
                    }
                }, (err)=> {
                    if (err && tries_left) {
                        tries_left--;
                        send_manifest(tries_left);
                        return;
                    } else if (err) {
                        options.abort_cb();
                    }
                    log.info('Sending manifest file to DL API');
                    fs.unlinkSync(filename + ".manifest.json");
                    for (var i=0; i < options.progressObject.parts; i++)
                        fs.unlinkSync(filename + ".part" + i);
                    options.success_cb(err);
                });
            }
        }
    }

    return {
        upload: upload
    };
}

module.exports.init = init;