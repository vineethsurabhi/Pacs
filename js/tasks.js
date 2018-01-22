require("electron-cookies");
var log = require("electron").remote.getGlobal("logObject");

$(document).ready(function() {
	
	// Show the loading modal and the circular overlay
	function showLoad() {
		document.getElementById("loader").style.display = "block";
		document.getElementById("overlay").style.display = "block";
	}
	// Remove the loading modal and the circular overlay
	function stopLoad() {
		document.getElementById("loader").style.display = "none";
		document.getElementById("overlay").style.display = "none";
	}

	var settings = {
		"async": true,
		"crossDomain": true,
		"url": `${configuration.urls.API}/get_task_list`,
		"method": "POST",
		"headers": {
			"content-type": "application/json",
		},
		"processData": false,
		"data": JSON.stringify({
			"user_token": localStorage.getItem("token")
		})
	};
	showLoad();
	$.ajax(settings).done(function(response) {
		stopLoad();
		var studies = JSON.parse(response);
		var content_accordion = function(data) {
			var object = JSON.parse(data);
			var ui_content;

			if (object.SeriesDescription) {
				ui_content = (object.SeriesDescription).map(function(data) {
					//	data.join(',')
					return (`<div class="ui grid" style="margin-top:0px;padding-top:0px;padding-bottom:0px;">\
								<div class="six wide column">\
									<div>${Object.keys(data)[0]}</div>\
								</div>\
								<div class="six wide column" style="">\
									<div>${data[Object.keys(data)[0]]}</div>\
								</div>\
							</div>`);
				});
			}
			return ui_content || [];
		};

		var check_status = function(data) {
			if ((data === 1) || (data === 2)) {
				return ("<div data-tooltip='Study is under process.' data-position='top left'><img width='26' height='26' src='./images/Study_processing.png'/></div>");
			} else if (data === 3) {
				return ("<div data-tooltip='Study processed.' data-position='top left'><img width='26' height='26' src='./images/Study_processed.png'/><div>");
			} 
			return ("<div data-tooltip='Study reported.' data-position='top left'><img width='26' height='26' src='./images/Study_reported.png'/><div>");
		};

		var check_viewer = function(data) {
			if ((data.status === 3) || (data.status === 4)) {
				return (`<a href="javascript:void(0)" onclick="goToWebapp({task_id:${data.task_id}, service:'task'})"><img style="opacity0.85;margin-top: 5px;width: 30px;height: 15px;" src="./images/Asset 2.png" /></a>`);
			} 
			return ("<img style='margin-top: 5px;width: 30px;height: 19px;' src='./images/Asset 3.png' />");
		};

		var check_report = function(data) {
			if (data.status === 4) {
				return (`<a href="javascript:void(0)" onclick="goToWebapp({task_id:${data.task_id}, service:'report'})">View Report</a>`);
			} 
			return ("");
		};

		var setRowColour = function(index) {
			if (index % 2 === 1) {
				return "rgb(240,240,240)";
			} 
			return "rgb(255,255,255";
		};

		$("#myTable").show();

		if (studies.length === 0) {
			studies = Object.values(require("./js/samples.json").studies);
		} 
		studies.forEach(function(data, index) {
			var study_accordion = $(`<tr class="ui title" style="background-color:${setRowColour(index)}">\
                                           <td> ${check_status(data.status)} </td>\
                                           <td> ${ moment.utc(JSON.parse(data.study_json).StudyDate).local().format("DD/MM/YYYY HH:mm:ss") || "-" }</td>\
                                           <td> ${ JSON.parse(data.study_json).PatientName || "-"}</td>\
                                           <td> ${ JSON.parse(data.study_json).PatientSex || "-"}</td>\
                                           <td> ${ JSON.parse(data.study_json).PatientAge || "-"}</td>\
                                           <td> ${ JSON.parse(data.study_json).PatientId || "-"}</td>\
                                           <td> ${ JSON.parse(data.study_json).StudyDescription || "-"}</td>\
                                           <td> ${ moment.utc(data.created).local().format("DD/MM/YYYY HH:mm:ss") || "-"}</td>\
                                           <td class="default">${check_viewer(data)}</td>\
                                       </tr>\
                                       <tr class="ui content">\
                                       	<td></td>
                                           <td colspan=6>\
                                               <div class="ui grid" style="margin-bottom:5px;">\
                                                   <div class="six wide column" style="padding-bottom:0px;">\
                                                       <div><b>Series Description</b></div>\
                                                   </div>\
                                                   <div class="six wide column" style="padding-bottom:0px;">\
                                                       <div><b>Number of Images</b></div>\
                                                   </div>\
                                               </div>\
                                            ${content_accordion(data.study_json).join("")}</td>\
                                           <td colspan=2 style="text-align:right;">${check_report(data)}</td>\
                                       </tr>`);
			$("#tbody").append(study_accordion);
		});
	});

	$(".ui.accordion")
		.accordion({
			selector: {
				trigger: ".ui.title > td:not(.default)"
			},
			onOpen: function() {}
		});
});

function goToWebapp(args) {

	var content = document.getElementsByClassName("content");
	content[0].style.zIndex = "-1";
	
	var liverFrame = document.getElementById("liverFrame");
	liverFrame.style.zIndex = "1";
	document.getElementsByClassName("footer")[0].style.zIndex = "-1";

	require("electron").remote.getGlobal("random").prop1 = localStorage.getItem("token");

	liverFrame.addEventListener("console-message", function(e) {
		console.log(e);
	});
	log.info({ trace: new Error().stack }, "Redirecting to webapp from predix");
	liverFrame.src = `${configuration.urls.API}/predex_user_login?task_id=${args["task_id"]}&&service=${args["service"].toString()}`;
	document.body.style.overflow = "hidden";
	
}