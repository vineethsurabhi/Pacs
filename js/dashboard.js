$(document).ready(function () {

	$(".ui.accordion").first()
		.accordion();

	$(".keySelect")
		.dropdown();

	var keySelect;

	var finaldata = {};

	var syncData = {
		"ARTERIAL": "",
		"VENOUS": "",
		"PORTAL": ""
	};

	var study_json = {
		"StudyDate": "",
		"PatientName": "",
		"PatientSex": "",
		// "PatientAge":"",
		"PatientId": "",
		"StudyDescription": "",
		"SeriesDescription": []
	};

	var study_info = {
		"ARTERIAL": "",
		"PORTAL": "",
		"VENOUS": ""
	};

	// Advanced Search
	var advancedSearch = false;

	// $("#advancedSearch").on("click",function(){
	//	 if(advancedSearch) {
	//		 console.log("came in")
	//		 $("#advanceSearchParam").fadeIn();
	//	 } else {
	//		 $("#advanceSearchParam").fadeOut();
	//	 }
	//	 advancedSearch = !advancedSearch;
	// })

	$(document).on("click", "#advancedSearch", function () {
		// $(this).hide();
		// $(".searchParams").clone().appendTo("#paramSection");
		advancedSearch = true;
		$(this).hide();
		$("#paramSection").append("<div class='ui grid'>\
										<div class='four wide column'>\
											<select class='ui dropdown keySelect' id=''>\
												<option class='item' value=''>Select Key</option>\
												<option class='item' value='PatientName'>Patient Name</option>\
												<option class='item' value='PatientSex'>Patient Sex</option>\
												<option class='item' value='StudyDescription'>Study Description</option>\
												<option class='item' value='StudyInstanceUID'>StudyInstanceUID</option>\
												<option class='item' value='SeriesDescription'>Series Description</option>\
												<option class='item' value='SeriesNumber'>Series Number</option>\
												<option class='item' value='SeriesType'>Series Type</option>\
												<option class='item' value='SeriesInstanceUID'>SeriesInstanceUID</option>\
											</select>\
										</div>\
										<div class='four wide column'>\
											<div class='field' style='margin-top:5px;'>\
												<input type='text' name='KeyValue' placeholder='Enter Value'>\
											</div>\
										</div>\
										<div class='four wide column'>\
											<button id='advancedSearch' style='padding:0.571429em 0.78571429em' class='ui button'><center><i class='ui add icon' style='padding-top: 0.09em;padding-left: 0.16em;'></i></center></button>\
										</div>\
									</div>");
		$(".keySelect")
			.dropdown();
	});


	//  // Initialize Dropdown
	//  $(".keySelect")
	//	  .dropdown();

	// Initialize Calendar
	$(".ui.calendar").calendar({
		type: "date",
		formatter: {
			date: function (date) {
				return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
				// Return Formatted Date
			},
		}
	});

	$(document).on("keypress", "input[name=KeyValue]", function (e) {
		var key = e.which;
		if (key == 13) // the enter key code
		{
			$("#formSubmit").click();
			return false;
		}
	});

	$(document).on("keypress", "input[name=StudyID]", function (e) {
		var key = e.which;
		if (key == 13) // the enter key code
		{
			$("#formSubmit").click();
			return false;
		}
	});

	$(document).on("keypress", "input[name=PatientID]", function (e) {
		var key = e.which;
		if (key == 13) // the enter key code
		{
			$("#formSubmit").click();
			return false;
		}
	});

	$(document).on("keypress", ".ui.calendar", function (e) {
		e.preventDefault();
		var key = e.which;
		if (key == 13) // the enter key code
		{
			$("#formSubmit").click();
			return false;
		}
	});

	$(document).on("click", ".ui.accordion", function (e) {
		e.preventDefault();
	});



	// From Submission
	$("#formSubmit").click(function () {

		// Select Level Value
		$(this).addClass("loading");

		var StudyID, PatientID;
		finaldata = {};
		StudyID = $("input[name=StudyID]").val();
		PatientID = $("input[name=PatientID]").val();

		if (advancedSearch == true) {
			keySelect = ($(".keySelect").dropdown("get value"));
			// console.log("keySelect")
			// console.log(keySelect)

			var keyText = [];
			//var value = $("input[name=KeyValue]").val();

			// Push values of each key
			$("input[name=KeyValue]").each(function () {
				keyText.push($(this).val());
			});

			// console.log("key text")
			// console.log(keyText)

			// console.log("typeof")
			// console.log( keySelect instanceof Array)

			// Map Object keys with the values
			var data;
			if (keySelect instanceof Array) {
				data = keySelect.map(function (data, index) {
					keyText[index] = "*" + keyText[index] + "*";
					return ({
						[data]: keyText[index]
					});
				}).reduce(function (result, item) {
					var key = Object.keys(item)[0];
					result[key] = item[key];
					return result;
				},{});
			} else {
				keyText[0] = "*" + keyText[0] + "*";
				data = { keySelect: keyText[0] + "*" };
			}

			console.log("finaldata");
			console.log(data);

		}


		// Select Date
		// console.log("Date Selected")
		var fromDate = $("#fromDate").calendar("get date");

		var day, month, year;

		if (fromDate != undefined) {

			day = fromDate.getDate().toString();
			month = (fromDate.getMonth() + 1).toString();
			year = fromDate.getFullYear().toString();

			if (month < 10) {
				month = "0" + month;
			}

			if (day < 10) {
				day = "0" + day;
			}

			fromDate = year + month + day;
			finaldata["StudyDate"] = fromDate;
			console.log(fromDate);
			console.log(new Date().getMonth);
		}

		var toDate = $("#toDate").calendar("get date");

		if (toDate != undefined) {

			day = toDate.getDate().toString();
			month = (toDate.getMonth() + 1).toString();
			year = toDate.getFullYear().toString();

			if (month < 10) {
				month = "0" + month;
			}

			if (day < 10) {
				day = "0" + day;
			}

			toDate = year + month + day;

			finaldata["StudyDate"] = fromDate + "-" + toDate;
		}
		if (StudyID != "") {
			finaldata.StudyID = "*" + StudyID + "*";
		} else if (PatientID != "") {
			finaldata.PatientID = "*" + PatientID + "*";
		} else if (fromDate == toDate == undefined && finaldata.StudyID == finaldata.PatientID == "") {
			finaldata = {};
		}

		console.log("final data");
		console.log(finaldata);



		//Call for search
		var settings = {
			"async": true,
			"crossDomain": true,
			"url": "http://localhost:1337/scu/search/STUDY",
			"method": "POST",
			"headers": {
				"content-type": "application/json",
				// "cache-control": "no-cache",
			},
			"processData": false,
			"data": JSON.stringify({
				"level": "SERIES",
				"keys": finaldata,
			})
		};

		// console.log(settings.data)
		$.ajax(settings).done(function (response) {
			console.log(response);
			if (response.results.length == 0) {
				$("#formSubmit").removeClass("loading");
				$("#tablelist").hide();
				$("tbody").remove();
				// $("tbody").children().remove();
				alert("No records found for the given inputs");
				return;
			}

			var sid = [];
			var datalist;
			datalist = response.results.map(function (data) {

				if (data.StudyInstanceUID != undefined && !sid.includes(data.StudyInstanceUID)) {
					// console.log("StudyInstanceUID")
					// console.log(data.StudyInstanceUID)
					sid.push(data.StudyInstanceUID);
					return ({
						[data.StudyInstanceUID]: data
					});
				}
			});

			// Remove all undefined objects
			datalist = datalist.filter(Boolean);

			datalist = datalist.reduce(function (result, item) {
				if (item != null) {
					var key = Object.keys(item)[0];
					result[key] = item[key];
					return result;
				} else {
					// console.log("")
				}

			}, {});

			var accordionContent = function (StudyInstanceUID) {

				// var dropDownData = response.results.map(function(data) {
				//	 if (data.StudyInstanceUID == StudyInstanceUID) {
				//		 return ("<option value=" + data.SeriesInstanceUID + ">" + data.SeriesDescription + "</option>")
				//	 }
				// })

				var dropDownData = response.results.map(function (data) {
					var radio_tag = (series)=>
						`<input type='radio' 
							data-study-description=${JSON.stringify(data.SeriesDescription)}
							data-patient-id=${JSON.stringify(data.PatientID)}
							data-patient-sex=${JSON.stringify(data.PatientSex)}
							data-patient-name=${JSON.stringify(data.PatientName)}
							data-study-date=${data.StudyDate}
							series-description=${JSON.stringify(data.SeriesDescription)}
							name='${series}'
							value=${data.SeriesInstanceUID}>`;

					if (data.StudyInstanceUID == StudyInstanceUID) {
						return ("<div class='ui grid'>\
										<div class='ui row'>\
											<div class='one wide column'>\
											</div>\
											<div class='four wide column'>\
												'+ data.SeriesDescription + '\
											</div>\
											<div class='ten wide column'>\
												<div class='ui grid'>\
													<div class='ui row'>\
														<div class='four wide column'>\
															<div class='ui radio checkbox'>\
																" + radio_tag("ARTERIAL") + "\
																<label>ARTERIAL</label>\
															</div>\
														</div>\
														<div class='four wide column'>\
															<div class='ui radio checkbox'>\
																" + radio_tag("PORTAL") + "\
																<label>PORTAL</label>\
															</div>\
														</div>\
														<div class='four wide column'>\
															<div class='ui radio checkbox'>\
																" + radio_tag("VENOUS") + "\
																<label>VENOUS</label>\
															</div>\
														</div>\
													</div>\
												</div>\
											</div>\
											<div class='one wide column'>\
											</div>\
										</div>\
									</div>");
					}
				});

				var List = ("<td colspan=7>\
									<div class='ui gird'>\
										<div class='row'>\
											<div class='sixteen wide column'>\
												<div class='ui grid'>\
													<div class='ui row'>\
														<div class='one wide column'>\
														</div>\
														<div class='four wide column'>\
															<b>Series Description</b> \
														</div>\
														<div class='ten wide column'>\
															<b>Mark the series type</b> \
														</div>\
													</div>\
												</div>\
												"+ dropDownData.join("") + "\
												<br/><div class='row' >\
													<div class='sixteen wide column'>\
														<center><button id='sendSelectedBtn' class='ui button teal'>Send Selected</button></center>\
													</div>\
												</div>\
											</div>\
										</div>\
									</div>\
								</td>");
				$(".ui.dropdown").dropdown("refresh");
				return List;
			};

			$("#tablelist").show();
			$("tbody").remove();
			sid.map(function (data1) {

				if (datalist[data1] != undefined) {

					var tableData = "<tbody class='ui title'>\
											<tr>\
												<td>" + datalist[data1].PatientID + "</td>\
												<td>" + datalist[data1].PatientName + "</td>\
												<td>" + datalist[data1].PatientSex + "</td>\
												<td>" + datalist[data1].StudyDescription + "</td>\
												<td>" + datalist[data1].StudyDate + "</td>\
												<td>" + datalist[data1].StudyID + "</td>\
												<td>" + datalist[data1].PatientBirthDate + "</td>\
											</tr>\
											</tbody>\
											<tbody class='ui content'>\
											<tr class='no-border'>\
												" + accordionContent(datalist[data1].StudyInstanceUID) + "\
											</tr>\
											</tbody>";
					$("#tablelist").append(tableData);
				}
			});

			$("input[type='radio']").on("change", function () {
				console.log("changed");
				// uncheck checkboxes in the same column
				$("input[type='radio'][value='" + $(this).val() + "']").not(this).prop("checked", false);
			});

			var x = document.getElementsByTagName("tr");
			for (var i = 0; i < x.length; i++) {
				if (i % 4 == 1) {
					console.log(x[i].rowIndex);
					x[i].style.backgroundColor = "#E0E0E0";
				}
			}

			$(".ui.accordion")
				.accordion({
					onOpen: function () { }
				});

			$("#sendSelectedBtn").show();

			$(".ui.checkbox")
				.checkbox();

			// Initialize selection Dropdown
			$(".ArterialSelect")
				.dropdown("refresh");
			$(".VenousSelect")
				.dropdown("refresh");
			$(".PortalSelect")
				.dropdown("refresh");

			$("#formSubmit").removeClass("loading");
		})
			.fail(function () {
				alert("Please re-check the connection");
				$("#formSubmit").removeClass("loading");
			});

	});

	$(document).on("click", "#sendSelectedBtn", function () {
		$("input[type='radio']:checked").each(function () {

			syncData[$(this).attr("name")] = $(this).val();
			study_info[$(this).attr("name")] = $(this).attr("series-description");

			console.log("get patient details");
			console.log($(this).attr("data-study-date"));
			study_json["StudyDate"] = $(this).attr("data-study-date");
			study_json["PatientName"] = $(this).attr("data-patient-name");
			study_json["PatientSex"] = $(this).attr("data-patient-sex");
			// study_json["PatientAge"] = $(this).attr("data-patient-age");
			study_json["PatientId"] = $(this).attr("data-patient-id");
			study_json["StudyDescription"] = $(this).attr("data-study-description");
		});

		if (syncData.ARTERIAL == "" || syncData.PORTAL == "" || syncData.VENOUS == "") {
			alert("Select Arterial,Venous and Portal series");
		} else {
			$("#pageloader").show("fast", "swing", function () {
				send();
			});
		}
	});

	// Send Selection

	// $(document).on("click", "#sendSelection", function() {
	function send() {

		Object.keys(syncData).map(function (data) {
			if (syncData[data] !== "") {
				var settings = {
					"async": false,
					"crossDomain": true,
					"url": "http://localhost:1337/scu/selection",
					"method": "POST",
					"headers": {
						"content-type": "application/json",
					},
					"processData": false,
					"data": JSON.stringify({ "selection": syncData[data] })
				};

				$(".ui.modal").modal("hide dimmer");

				$.ajax(settings).done(function (response) {
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

					$.ajax(settings).done(function (response) {
						console.log(response);
						study_json["SeriesDescription"] = response.selection.map(function (element) {
							console.log(element.series + ":" + element.uids.length);
							return ({ [study_info[element.series]]: element.uids.length });
						}, this);
					})
						.fail(function (message) {
							console.log(message);
							console.log("unable to check the proper series");
							$("#pageloader").hide();
						});

				}).fail(function (message) {
					console.log(message);
					console.log("unable to select this series");
					$("#pageloader").hide();
				});
			}
		});
		// STORE AND SEND
		var settings = {
			"async": true,
			"crossDomain": true,
			"url": "http://localhost:1337/scu/scp",
			"method": "POST",
			"headers": {
				"content-type": "application/json",
			}
		};

		$.ajax(settings).done(function (response) {
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

			$.ajax(settings).done(function (response) {
				console.log(response);

				$("#pageloader").hide();
				// $(".ui.modal").modal("show");

				console.log("study json");
				console.log(study_json);

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

				$.ajax(settings).done(function (response) {
					console.log(response);
					console.log("sync completed");
					deleteSCU();
					// alert("Study uploaded successfully")
					window.location.href = "./success.html";
				})
					.fail(function (message) {
						alert("Selected study failed during sync phase");
						console.log(message);
						console.log("Sync Failed");
						deleteSCU();
						$("#pageloader").hide();
					});
			})
				.fail(function (message) {
					alert("Selected study failed during send phase");
					console.log(message);
					deleteSCU();
					$("#pageloader").hide();
				});
		})
			.fail(function () {
				alert("Selected study failed during store phase");
				deleteSCU();
				$("#pageloader").hide();
			});
		// })
	}

	function deleteSCU() {
		var settings = {
			"async": true,
			"crossDomain": true,
			"url": "http://localhost:1337/scu",
			"method": "DELETE",
			"headers": {
				"cache-control": "no-cache",
			}
		};

		$.ajax(settings).done(function (response) {
			console.log(response);
			resetConfig();
			$("#pageloader").hide();
		})
			.fail(function (response) {
				console.log(response);
				$("#pageloader").hide();
			});
	}

	function resetConfig() {
		var settings = {
			"async": true,
			"crossDomain": true,
			"url": "http://localhost:1337/scp",
			"method": "POST",
			"headers": {
				"cache-control": "no-cache",
			}
		};

		$.ajax(settings).done(function (response) {
			console.log(response);

			var settings = {
				"async": true,
				"crossDomain": true,
				"url": "http://localhost:1337/scu",
				"method": "POST",
				"headers": {
					"content-type": "application/json",
					"cache-control": "no-cache",
				},
				"processData": false,
				"data": JSON.stringify({
					"AETitle": localStorage.getItem("AETitle"),
					"Hostname": localStorage.getItem("Hostname"),
					"Port": parseInt(localStorage.getItem("Port"))
				})
			};

			$.ajax(settings).done(function (response) {
				console.log(response);
				$("#pageloader").hide();

				if (response.C_Echo != true) {
					alert("Server responded with C_ECHO FALSE");
				}
			}).fail(function (response) {
				console.log(response);
				$("#pageloader").hide();
				alert("Failed to reset SCU");
			});

		}).fail(function () {
			$("#pageloader").hide();
			alert("Failed to reset SCP");
		});
	}

});
