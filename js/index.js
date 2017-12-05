$(document).ready(function () {
	// Function to select all studies
	$("#selectAll").change(function () {
		if ($(this).is(":checked")) {
			$("input[name='selectStudy']").prop("checked", true);
		} else {
			$("input[name='selectStudy']").prop("checked", false);
		}
	});

	$("table").tablesort();

});