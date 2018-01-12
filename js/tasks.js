require("electron-cookies");
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
		"url": "https://liver.prediblehealth.com/get_task_list",
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

			if (object != null && object.SeriesDescription != undefined) {
				ui_content = (object.SeriesDescription).map(function(data) {
					//	data.join(',')
					return ("<div class='ui grid' style='margin-top:0px;padding-top:0px;padding-bottom:0px;'>\
								<div class='one wide column' style=''></div>\
								<div class='six wide column' style=''>\
									<div>" + (Object.keys(data)[0]) + "</div>\
								</div>\
								<div class='six wide column' style=''>\
									<div>" + data[Object.keys(data)[0]] + "</div>\
								</div>\
							</div>");
				});
			}
			if (ui_content != undefined) {
				return ui_content;
			} else {
				return [""];
			}
		};

		var check_status = function(data) {
			if ((data == 1) || (data == 2)) {
				return ("<div data-tooltip='Study is under process.' data-position='top left'><img width='26' height='26' src='./images/Study_processing.png'/></div>");
			} else if (data == 3) {
				return ("<div data-tooltip='Study processed.' data-position='top left'><img width='26' height='26' src='./images/Study_processed.png'/><div>");
			} else if (data == 4) {
				return ("<div data-tooltip='Study reported.' data-position='top left'><img width='26' height='26' src='./images/Study_reported.png'/><div>");
			}
		};

		var check_viewer = function(data) {
			if ((data.status == 3) || (data.status == 4)) {
				return ("<a href="+configuration.urls.API+"/task/"+ data.task_id +"><img style='opacity0.85;margin-top: 5px;width: 30px;height: 15px;' src='./images/Asset 2.png' /></a>");
			} else {
				return ("<img style='margin-top: 5px;width: 30px;height: 19px;' src='./images/Asset 3.png' />");
			}
		};

		// href='"+configuration.urls.API+"'/task/'" + data.task_id + "'

		var format_date = function(data) {
			if (data != undefined) {
				data = data.toString();
				return addZero(data.substr(6, 2)) + "/" + addZero(data.substr(4, 2)) + "/" + data.substr(0, 4);
			} else {
				return "-";
			}
		};

		var check_report = function(data) {
			if (data.status == 4) {
				return ("<a href='/report/" + data.task_id + "'>View Report</a>");
			} else {
				return ("");
			}
		};

		function addZero(i) {
			i = parseInt(i);
			if (i < 10) {
				i = "0" + i;
			}
			return i;
		}

		var convert_date = function(data) {
			// var new_date = moment.utc(data).local().format('YYYY-MM-DD HH:mm:ss');
			// console.log(new Date(data + new Date().getTimezoneOffset()))
			var new_date = new Date(data.getTime() + data.getTimezoneOffset() * 60 * 1000);
			var offset = data.getTimezoneOffset() / 60;
			var hours = data.getHours();
			new_date.setHours(hours - offset);
			var suffix = new_date.getHours() >= 12 ? "PM" : "AM";
			hours = ((new_date.getHours() + 11) % 12 + 1);

			return (addZero(new_date.getDate()) + "/" + addZero(new_date.getMonth()) + "/" + new_date.getFullYear() + " " + addZero(hours) + ":" + addZero(new_date.getMinutes()) + ":" + addZero(new_date.getSeconds()) + " " + suffix);
		};

		function checkUndefined(data) {
			if (data != undefined) {
				return data;
			} else {
				return "-";
			}
		}
		if (studies.length > 0) {
			$("#message").hide();
			$("#myTable").show();

			studies.map(function(data, index) {
				var color;
				if (index % 2 == 1) {
					color = "rgb(240,240,240)";
				} else {
					color = "rgb(255,255,255";
				}

				var study_accordion = $("<tr class='ui title' style='background-color:" + color + "'>\
                                            <td>" + check_status(data.status) + "</td>\
                                            <td>" + format_date(JSON.parse(data.study_json).StudyDate) + "</td>\
                                            <td>" + checkUndefined(JSON.parse(data.study_json).PatientName) + "</td>\
                                            <td>" + checkUndefined(JSON.parse(data.study_json).PatientSex) + "</td>\
                                            <td>" + checkUndefined(JSON.parse(data.study_json).PatientAge) + "</td>\
                                            <td>" + checkUndefined(JSON.parse(data.study_json).PatientId) + "</td>\
                                            <td>" + checkUndefined(JSON.parse(data.study_json).StudyDescription) + "</td>\
                                            <td>" + convert_date(new Date(data.created)) + "</td>\
                                            <td class='default'>"+ check_viewer(data) +"</td>\
                                        </tr>\
                                        <tr class='ui content'>\
                                            <td colspan=7>\
                                                <div class='ui grid' style='margin-bottom:5px;'>\
                                                    <div class='one wide column'></div>\
                                                    <div class='six wide column' style='padding-bottom:0px;'>\
                                                        <div><b>Series Description</b></div>\
                                                    </div>\
                                                    <div class='six wide column' style='padding-bottom:0px;'>\
                                                        <div><b>Number of Images</b></div>\
                                                    </div>\
                                                </div>\
                                            " + content_accordion(data.study_json).join("") + "" + "</td>\
                                            <td colspan=2 style='text-align:right;'>"+check_report(data)+"</td>\
                                        </tr>");
				$("#tbody").append(study_accordion);
			});
		} else {
			$("#message").show();
		}
	});

	$(".ui.accordion")
		.accordion({
			selector: {
				trigger: ".ui.title > td:not(.default)"
			},
			onOpen: function() {}
		});
});