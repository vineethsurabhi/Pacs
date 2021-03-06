document.ondragover = document.ondrop = (ev) => {
	ev.preventDefault();
};

const moment = require("moment");
const configuration = require("./config.json");
const ProgressBar = require("progressbar.js");

var log = require("electron").remote.getGlobal("logObject");

var response_length;
var study_json = {
	"StudyDate": "",
	"PatientName": "",
	"PatientSex": "",
	"PatientAge": "",
	"PatientId": "",
	"StudyDescription": "",
	"SeriesDescription": []
};

log.info({ trace: new Error().stack }, "Redirected to dropzone");

document.getElementById("drop_zone").onchange = document.getElementById("drop_zone").ondrop = function(ev) {
	log.info({ trace: new Error().stack }, "Study dropped to dropzone");
	var fullpath;
	if (typeof ev.target.files[0] === "undefined") {
		fullpath = ev.dataTransfer.files[0].path;
	} else if (ev.target.files[0].path) {
		fullpath = ev.target.files[0].path;
	} else {
		return;
	}

	var line = new ProgressBar.Line("#line", {
		easing: "easeInOut",
		color: "rgb(19, 195, 188)",
		height: "5px",
		strokeWidth: 0.3,
		trailColor:"rgb(101,94,94)",
		trailWidth: 0.2
	});

	var imageUrl = "../images/Asset 48.png";
	$(".dropZoneOverlay").css("background-image", "url(" + imageUrl + ")");
	// $("#pageloader").show();

	$("#filePathMessage").html("Are you sure you want to upload study " + fullpath.replace(/^.*[\\/]/, "") + "?");
	$("#filePathDialog").modal("setting", {
		onApprove: function() {
			log.info({ trace: new Error().stack }, "Study approved to upload.");
			$("#pageloader").show();
			var sync = require("./js/sync.js");
			sync.init({
				filepath: fullpath,
				url: configuration.urls.API,
				token: localStorage.getItem("token"),
				zip_cb: show_progress_compression,
				upload_cb: show_progress_upload,
				cancel_cb: add_cancel_action,
				error_cb: show_error,
				abort_cb: abort,
				success_cb: upload_complete,
				progressObject: progressObject,
				logObject: log
			}).upload();
		},
		onDeny: function() {
			log.info({ trace: new Error().stack }, "Study denied to applied.");
			$("#progressText").html("Upload files to cloud here");
			document.getElementById("drop_zone").value = "";
			$("#navbar").css("border-bottom","3px solid rgb(19, 195, 188)");
			$("#line").html("");
		}
	}).modal("show");

	function show_progress_compression(obj) {
		$("#navbar").css("border-bottom","none");
		require("electron").remote.getCurrentWindow().setProgressBar(obj.bytes_read / obj.total_size);
		line.animate(obj.bytes_read / obj.total_size);
		$("#progressText").html(`Compressed ${Math.floor(obj.bytes_read/(1024*1024))} MB of ${Math.floor(obj.total_size/(1024*1024))} MB  (${obj.rate.toFixed(2)} MB/s; ETA: ${moment.duration(obj.eta*1000).humanize()})`);
	}

	function show_progress_upload(obj) {
		var read = obj.bytes_read;
		var total = obj.total_size;
		require("electron").remote.getCurrentWindow().setProgressBar(read / total);
		line.animate(read/total);
		$("#progressText").html(`Securely uploading ${Math.floor(read/(1024*1024))} MB of ${Math.floor(total/(1024*1024))} MB (${obj.rate.toFixed(2)} MB/s; ETA: ${moment.duration(obj.eta*1000).humanize()})`);
	}

	function show_error(err = "Unknown Error") {
		log.warn({ trace: new Error().stack }, err);
		alert(err.message);
	}

	function abort(err) {
		log.warn({ trace: new Error().stack }, err);
		alert("Error uploading file");
		$("#pageloader").hide();
	}

	var cancel_button = $("#cancel_action");

	var progressObject = {
		total_size: 0,
		bytes_read: 0,
		rate: 0,
		eta: 0
	};
	show_progress_compression(progressObject);

	function add_cancel_action(cb) {
		cancel_button.unbind("click");
		cancel_button.click(() => {
			if (cb) cb();
			var win = require("electron").remote.getCurrentWindow();
			document.getElementById("drop_zone").value = "";
			win.setProgressBar(-1);
			$("#pageloader").hide();
			progressObject = {
				total_size: 0,
				bytes_read: 0,
				rate: 0,
				eta: 0
			};
			show_progress_compression(progressObject);
		});
	}

	function upload_complete(err) {
		if (err) {
			show_error();
			return;
		}
		//alert("File upload completed");
		log.info({ trace: new Error().stack }, "Study uploaded successfully");
		var win = require("electron").remote.getCurrentWindow();
		win.setProgressBar(-1);
		win.flashFrame(true);
		// $("#pageloader").hide();
		log.info({ trace: new Error().stack }, "Redirected to success page");
		window.alert("Study uploaded successfully");
		$("#progressText").html("Upload files to cloud here");
		document.getElementById("drop_zone").value = "";
		$("#navbar").css("border-bottom","3px solid rgb(19, 195, 188)");
		$("#line").html("");
		// window.location.href = "./success.html";
	}

	return;

	/*
	//console.log(ev.target.files[0].path)
	var data = JSON.stringify({
		"path": fullpath,
		"extension": ""
	})

	var settings = {
		"async": true,
		"crossDomain": true,
		"url": "http://localhost:1337/scu/filepath",
		"method": "POST",
		"headers": {
			"content-type": "application/json",
		},
		"processData": false,
		"data": data
	}

	var series_info = [];

	$.ajax(settings).done(function(response) {
		$("#pageloader").hide();
		$("#dropzone_text").hide();
		console.log(response);
		if (response.results.length > 0) {
			study_json["StudyDate"] = response.results[0].StudyDate;
			study_json["PatientName"] = response.results[0].PatientName;
			study_json["PatientSex"] = response.results[0].PatientSex;
			study_json["PatientAge"] = response.results[0].PatientAge;
			study_json["PatientId"] = response.results[0].PatientID;
			study_json["StudyDescription"] = response.results[0].StudyDescription;
			response_length = response.results.length;
			var header = $('<div class="ui grid" id="header"><br/>\
							<div class="ui row"  style="text-align:left;padding:20px 20px">\
								<div class="eight wide column">\
									<p style="font-size:12px">File Name</p>\
								</div>\
								<div class="eight wide column">\
									<p style="font-size:12px">Choose Series</p>\
								</div>\
							</div>\
							</div>');
			$(header).insertBefore('#list-items');
			document.getElementById('drop_zone').type = 'hidden';
			response.results.map(function(event,index) {
				 $("#list-items").append('<div class="ui segment" data-segment-index='+index+' style="padding-bottom:20px;margin:0px;">\
											<div class="ui grid">\
												<div class="ui row" style="padding:2px;">\
													<div class="eight wide column" style="text-align:left">\
														<span class="series_label" data-content='+ event.SeriesInstanceUID +' style="position:relative;top:7px;left:5px;text-align:left">' + event.SeriesDescription + '</span>\
													</div>\
													<div class="six wide column">\
													<select class="ui dropdown keySelect right" data-series='+ JSON.stringify(event.SeriesDescription) +' id='+ event.SeriesInstanceUID +'>\
														<option class="item" value="">Select Series</option>\
														<option class="item" value="ARTERIAL" data-seriesid=' + event.SeriesInstanceUID + ' data-series="ARTERIAL">ARTERIAL</option>\
														<option class="item" value="PORTAL" data-seriesid=' + event.SeriesInstanceUID + ' data-series="PORTAL">PORTAL</option>\
														<option class="item" value="VENOUS" data-seriesid=' + event.SeriesInstanceUID + ' data-series="VENOUS">VENOUS</option>\
													</select>\
													</div>\
													<div class="two wide column" style="margin-top:5px;">\
													<img class="close_study" data-index='+index+' src="./images/Cancel.png" width="20" height="20">\
													</div>\
												</div>\
											</div>\
										</div>')
				$('.ui.dropdown').dropdown();
			})

			$(".series_label").popup();
			console.log('series_info')
			console.log(series_info)

			$('.dropZoneOverlay').append("<br/><button class='ui button teal' id='reset'>Reset</button>")
			$('.dropZoneOverlay').append("<button class='ui button teal' id='sendSelection'>Submit</button>")
		} else {
			alert('No Data Found')
		}

	}).fail(function(message){
		alert('Read from disk failed')
		$("#pageloader").hide();
	})
	*/
};

var deleted = 1;

$(document).on("click", ".close_study", function() {
	console.log("leng");
	console.log(response_length);
	if(deleted <response_length){
		deleted++;
	} else {
		console.log("ends");
		response_length = 0;
		$("#reset").remove();
		$("#sendSelection").remove();
		$("#header").remove();
		document.getElementById("drop_zone").type = "file";
		deleted=1;
	}
	$("div.ui.segment[data-segment-index="+ $(this).attr("data-index") +"]").remove();

});

var series = [];
// $(".dropZoneContainer").hide();

/*
var header = $('<div class="ui grid">\
					<div class="ui row">\
						<div class="nine wide column">\
							<p>File Name</p>\
						</div>\
						<div class="seven wide column">\
							<p>Choose Series</p>\
						</div>\
					</div>\
					</div>');
*/

// jsondata.results.map(function(event) {
//	 $("#list-items").append('<div class="ui segment" style="padding-bottom:25px;">\
//								 <div class="ui grid">\
//									 <div class="ui row">\
//										 <div class="nine wide column" style="text-align:left">\
//											 <span style="position:relative;top:7px;text-align:left">' + event.SeriesDescription + '</span>\
//										 </div>\
//										 <div class="seven wide column">\
//										 <select class="ui dropdown keySelect right" id='+ event.SeriesInstanceUID +'>\
//											 <option class="item" value="">Select Series</option>\
//											 <option class="item" value="ARTERIAL" data-seriesid=' + event.SeriesInstanceUID + ' data-series="ARTERIAL">ARTERIAL</option>\
//											 <option class="item" value="PORTAL" data-seriesid=' + event.SeriesInstanceUID + ' data-series="PORTAL">PORTAL</option>\
//											 <option class="item" value="VENOUS" data-seriesid=' + event.SeriesInstanceUID + ' data-series="VENOUS">VENOUS</option>\
//										 </select>\
//										 </div>\
//									 </div>\
//								 </div>\
//							  </div>')
//	 $('.ui.dropdown').dropdown();
//	 document.getElementById('drop_zone').type = 'hidden';
// })

// $('.dropZoneOverlay').append("<br/><button class='ui button' id='reset'>Reset</button>")
// $('.dropZoneOverlay').append("<button class='ui button' id='sendSelection'>Send</button>")

var finalData = {
	"ARTERIAL": "",
	"PORTAL": "",
	"VENOUS": ""
};

function resetDropdowns(){
	$(".ui.dropdown").dropdown("restore defaults");
	finalData.ARTERIAL = finalData.PORTAL = finalData.VENOUS = "";
	series = [];
	getContext.ARTERIAL=getContext.PORTAL=getContext.VENOUS="";
	last_focus = "";
}

$(document).on("click", "#reset", function(event) {
	event.preventDefault();
	resetDropdowns();
});

$(document).on("click", "#sendSelection", function() {
	console.log("finalData");
	console.log(finalData);

	console.log(Object.keys(finalData));
	//$("#pageloader").show();
	if (finalData.ARTERIAL === "" || finalData.PORTAL === "" || finalData.VENOUS === "") {
		alert("Select Arterial,Venous and Portal series");
	} else {
		$("#pageloader").show("fast", "swing", function() {
			send();
		});
	}
});

function deleteSelection(){
	var settings = {
		"async": true,
		"crossDomain": true,
		"url": "http://localhost:1337/scu/selection",
		"method": "DELETE",
		"headers": {
			"content-type": "application/json",
			"cache-control": "no-cache",
		},
		"processData": false,
	};

	$.ajax(settings).done(function (response) {
		console.log(response);
		// resetDropdowns();
		$("#pageloader").hide();
	});
}

function send() {
	var series_length;
	Object.keys(finalData).forEach(function(data) {
		if (finalData[data] !== "") {
			var settings = {
				"async": false,
				"crossDomain": true,
				"url": "http://localhost:1337/scu/selection",
				"method": "POST",
				"headers": {
					"content-type": "application/json",
				},
				"processData": false,
				"data": JSON.stringify({ "selection": finalData[data] })
			};

			$.ajax(settings).done(function(response) {
				console.log(response);

				var settings = {
					"async": false,
					"crossDomain": true,
					"url": "http://localhost:1337/scu/series/" + data,
					"method": "POST",
					"headers": {
						"cache-control": "no-cache",
					}
				};

				$.ajax(settings).done(function(response) {
					console.log(response);
					series_length = response;
				}).fail(function(response){
					console.log(response);
					deleteSelection();
					alert("Unable to select Arterial,Venous and Portal series.");
				});
			}).fail(function(response){
				console.log(response);
				deleteSelection();
				alert("Error adding series to the selection");
			});
		}
	});

	study_json["SeriesDescription"] = series_length.selection.map(function(element) {
		console.log(`${element.series}:${element.uids.length}`);
		return ({ [study_info[element.series]] : element.uids.length });
	}, this);

	console.log("study_json");
	console.log(study_json);
	// STORE AND SYNC

	var settings = {
		"async": true,
		"crossDomain": true,
		"url": "http://localhost:1337/scu/scp",
		"method": "POST",
		"headers": {
			"content-type": "application/json",
		}
	};

	$.ajax(settings).done(function(response) {
		console.log(response);

		var settings = {
			"async": true,
			"crossDomain": true,
			"url": "http://localhost:1337/scu/scp/send",
			"method": "POST",
			"headers": {
				"content-type": "application/json",
			}
		};

		$.ajax(settings).done(function(response) {
			console.log(response);
			$("#pageloader").hide();
			// $(".ui.modal").modal("show");
			console.log("send completed");
			var settings = {
				"async": false,
				"crossDomain": true,
				"url": "http://localhost:1337/scu/scp/sync",
				"method": "POST",
				"headers": {
					"content-type": "application/json",
				},
				"data": JSON.stringify({
					"user_token": localStorage.getItem("token"),
					"study_json": study_json
				})
			};

			$.ajax(settings).done(function(response) {
				console.log(response);
				console.log("Sync completed");
				deleteSelection();
				window.location.href="./success.html";
			}).fail(function(){
				deleteSelection();
				alert("Selected study failed during sync phase");
			});
		}).fail(function(){
			deleteSelection();
			alert("Selected study failed during send phase");
		});
	}).fail(function(){
		deleteSelection();
		alert("Selected study failed during store phase");
	});
}

var getContext = {
	"ARTERIAL": "",
	"PORTAL": "",
	"VENOUS": ""
};

var study_info = {
	"ARTERIAL":"",
	"PORTAL":"",
	"VENOUS":""
};
// var val;
var last_focus;

$("#list-items").on("focus","div.keySelect", function(event){
	event.preventDefault();
	if($(this).dropdown("get text") !== "Select Series" || $(this).dropdown("get text") !== "") {
		last_focus = $(this).dropdown("get text");
	}
});

$("#list-items").on("change", "div.keySelect", function(event) {
	// console.log($(this).attr("id"))
	event.preventDefault();
	var select = $(this).children();

	var val = (select[0].options[select[0].options.selectedIndex].getAttribute("data-seriesid"));

	if($(this).dropdown("get text") !== "Select Series") {

		if (!series.includes($(this).dropdown("get text"))) {
			series.push($(this).dropdown("get text"));
			if ($(this).dropdown("get text") === "ARTERIAL") {
				finalData.ARTERIAL = val;
				study_info.ARTERIAL = select.attr("data-series");
				getContext[$(this).dropdown("get text")] = $(this);
			} else if ($(this).dropdown("get text") === "PORTAL") {
				finalData.PORTAL = val;
				study_info.PORTAL = select.attr("data-series");
				getContext[$(this).dropdown("get text")] = $(this);
			} else if ($(this).dropdown("get text") === "VENOUS") {
				finalData.VENOUS = val;
				study_info.VENOUS = select.attr("data-series");
				getContext[$(this).dropdown("get text")] = $(this);
			}
		} else {

			if( $(this).dropdown("get text") !== "Select Series" && getContext[$(this).dropdown("get text")] !=="" ) {
				getContext[$(this).dropdown("get text")].dropdown("restore defaults");
				getContext[last_focus]="";
				finalData[last_focus] = "";
				study_info[last_focus] = "";
			}

			if ($(this).dropdown("get text") === "ARTERIAL") {
				finalData.ARTERIAL = val;
				study_info.ARTERIAL = select.attr("data-series");
				getContext[$(this).dropdown("get text")] = $(this);
			} else if ($(this).dropdown("get text") === "PORTAL") {
				finalData.PORTAL = val;
				study_info.PORTAL = select.attr("data-series");
				getContext[$(this).dropdown("get text")] = $(this);
			} else if ($(this).dropdown("get text") === "VENOUS") {
				finalData.VENOUS = val;
				study_info.VENOUS = select.attr("data-series");
				getContext[$(this).dropdown("get text")] = $(this);
			}
		}
	} else {
		// getContext[event.target.value].dropdown("restore defaults")
		// getContext[event.target.value]="";
	}
});
