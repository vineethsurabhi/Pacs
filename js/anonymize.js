const dicomParser = require("dicom-parser");
const node_crypto = require("crypto");

const dictionary = {
	//patient information
	patientID: "x00100020",
	patientName:"x00100010",
	patientSex :"x00100040",
	patientBirthDate:"x00100030",
	protocolName:"x00181030",
	patientsAge:"x00101010",
	patientOrientation:"x00200020",
	// study information
	studyID:"x00200010",
	studyDate:"x00080020",
	studyTime:"x00080030",
	//series information
	seriesNumber:"x00200011",
	seriesDate:"x00080021",
	seriesTime:"x00080031",
	bodyPartExamined:"x00180015",
	seriesDescription:"x0008103e",
	// instance information
	acquisitionDate:"x00080022",
	acquistionTime:"x00080032",
	//Equipment information
	manufacturer:"x00080070",
	ManufacturersModelName:"x00081090",
	ReferringPhysicianName :"x0080090",
	//UID information
	studyInstanceUID:"x0020000d",
	seriesInstanceUID:"x0020000e",
	sopInstanceUID:"x00080018",
	sopClassUID:"x00080016",
};

function init(options, db) {
	let maps = {};

	db.run("CREATE TABLE IF NOT EXISTS userInterface(id INTEGER , userID varchar(100) ,studyInstanceUID varchar(100) PRIMARY KEY)");
	db.run("CREATE TABLE IF NOT EXISTS series(id INTEGER ,  studyInstanceUID varchar(100) ,seriesInstanceUID varchar(100) )");

	db.run("CREATE TABLE IF NOT EXISTS studyInterface(id INTEGER PRIMARY KEY AUTOINCREMENT,studyInstanceUID varchar(100) , anonStudyInstanceUID varchar(100),seriesInstanceUID varchar(100) ,anonSeriesInstanceUID varchar(100), sopInstanceUID varchar(100) , anonSopInstanceUID varchar(100),FOREIGN KEY(studyInstanceUID) REFERENCES userInterface(studyInstanceUID))");
	db.run("CREATE TABLE IF NOT EXISTS tags(id INTEGER PRIMARY KEY AUTOINCREMENT,anonSopInstanceUID varchar(100),tagName varchar(100), oldValue varchar(1000),anonValue varchar(1000) ,FOREIGN KEY(anonSopInstanceUID) REFERENCES studyInterface(anonSopInstanceUID))");


	function add_entry(studyInstanceUID, seriesInstanceUID, sopInstanceUID) {
		db.serialize(function () {
			let userTableStmt = db.prepare("INSERT or REPLACE into userInterface(userID,studyInstanceUID) values(?,?)");
			userTableStmt.run(localStorage.getItem("user"),studyInstanceUID);
			userTableStmt.finalize();
			let seriesTableStmt = db.prepare("INSERT or REPLACE into series(studyInstanceUID,seriesInstanceUID) values(?,?)");
			seriesTableStmt.run(studyInstanceUID,seriesInstanceUID);
			seriesTableStmt.finalize();
			let studyTableStmt = db.prepare("INSERT or REPLACE into studyInterface(studyInstanceUID,AnonStudyInstanceUID,seriesInstanceUID,AnonSeriesInstanceUID,sopInstanceUID,AnonSopInstanceUID) values(?,?,?,?,?,?)");
			studyTableStmt.run(studyInstanceUID, maps[studyInstanceUID].translation, seriesInstanceUID, maps[studyInstanceUID].series[seriesInstanceUID].translation, sopInstanceUID, maps[studyInstanceUID].series[seriesInstanceUID].sopInstances[sopInstanceUID].sopInstanceUID.translation);
			studyTableStmt.finalize();
			let tagTableStmt = db.prepare("INSERT or REPLACE into tags(AnonSopInstanceUID,tagName,oldValue,anonValue) values(?,?, ?,?)");
			let instance = maps[studyInstanceUID].series[seriesInstanceUID].sopInstances[sopInstanceUID];
			for (let tag in instance) {
				if (!instance.hasOwnProperty(tag)) continue;
				tagTableStmt.run(instance.sopInstanceUID.translation, tag, instance[tag].value, instance[tag].translation);
			}
			tagTableStmt.finalize();
		});
	}

	function anonymize(filebuffer) {
		let dcm = dicomParser.parseDicom(filebuffer);
		let studyInstanceUID = dcm.string(dictionary.studyInstanceUID);
		let seriesInstanceUID = dcm.string(dictionary.seriesInstanceUID);
		console.log(seriesInstanceUID);
		let sopInstanceUID = dcm.string(dictionary.sopInstanceUID);
		if (!maps[studyInstanceUID]) {
			maps[studyInstanceUID] = {
				translation: anonymizetag(dcm, dictionary.studyInstanceUID),
				series: {}
			};
			if (!maps[studyInstanceUID].series[seriesInstanceUID]) {
				maps[studyInstanceUID].series[seriesInstanceUID] = {
					translation: anonymizetag(dcm, dictionary.seriesInstanceUID),
					sopInstances: {}
				};
				if (!maps[studyInstanceUID].series[seriesInstanceUID].sopInstances[sopInstanceUID]) {
					maps[studyInstanceUID].series[seriesInstanceUID].sopInstances[sopInstanceUID] = {
						sopInstanceUID: {
							value: sopInstanceUID,
							translation: anonymizetag(dcm, dictionary.sopInstanceUID)
						},
						patientName: {
							value: dcm.string(dictionary.patientName),
							translation: anonymizetag(dcm, dictionary.patientName)
						},
						patientSex: {
							value: dcm.string(dictionary.patientSex),
							translation: anonymizetag(dcm, dictionary.patientSex)
						},
						patientBirthDate: {
							value: dcm.string(dictionary.patientBirthDate),
							translation: anonymizetag(dcm, dictionary.patientBirthDate)
						},
						protocolName: {
							value: dcm.string(dictionary.protocolName),
							translation: anonymizetag(dcm, dictionary.protocolName)
						},
						patientAge: {
							value: dcm.string(dictionary.patientsAge),
							translation: anonymizetag(dcm, dictionary.patientsAge)
						},
						patientOrinetation: {
							value: dcm.string(dictionary.patientOrientation),
							translation: anonymizetag(dcm, dictionary.patientOrientation)
						},
						studyID: {
							value: dcm.string(dictionary.studyID),
							translation: anonymizetag(dcm, dictionary.studyID)
						},
						studyDate: {
							value: dcm.string(dictionary.studyDate),
							translation: anonymizeDate(dcm, dictionary.studyDate),
						},
						studyTime: {
							value: dcm.string(dictionary.studyTime),
							translation: anonymizeTime(dcm, dictionary.studyTime)
						},
						seriesNumber: {
							value: dcm.string(dictionary.seriesNumber),
							translation: anonymizetag(dcm, dictionary.seriesNumber)
						},
						seriesDate: {
							value: dcm.string(dictionary.seriesDate),
							translation: anonymizeDate(dcm, dictionary.seriesDate)
						},
						seriesTime: {
							value: dcm.string(dictionary.seriesTime),
							translation: anonymizeTime(dcm, dictionary.seriesTime)
						},
						bodyPartExamined: {
							value: dcm.string(dictionary.bodyPartExamined),
							translation: anonymizetag(dcm, dictionary.bodyPartExamined)
						},
						seriesDescription: {
							value: dcm.string(dictionary.seriesDescription),
							translation: anonymizetag(dcm, dictionary.seriesDescription)
						},
						acquistionDate: {
							value: dcm.string(dictionary.acquisitionDate),
							translation: anonymizeDate(dcm, dictionary.acquisitionDate)
						},
						acquistionTime: {
							value: dcm.string(dictionary.acquistionTime),
							translation: anonymizeTime(dcm, dictionary.acquistionTime)
						},
						manufacturer: {
							value: dcm.string(dictionary.manufacturer),
							translation: anonymizetag(dcm, dictionary.manufacturer)
						},
						ManufacturersModelName: {
							value: dcm.string(dictionary.ManufacturersModelName),
							translation: anonymizetag(dcm, dictionary.ManufacturersModelName)
						},
						ReferringPhysicianName: {
							value: dcm.string(dictionary.ReferringPhysicianName),
							translation: anonymizetag(dcm, dictionary.ReferringPhysicianName)
						},
					};
					add_entry(studyInstanceUID, seriesInstanceUID, sopInstanceUID);
				}
			}
			return dcm.byteArray;
		}
		

		let bytearray = anonymizeSecond(dcm);
		maps[studyInstanceUID] = {
			translation: anonymizetag(dcm, dictionary.studyInstanceUID),
			series: {}
		};
		maps[studyInstanceUID].series[seriesInstanceUID] = {
			translation: anonymizetag(dcm, dictionary.seriesInstanceUID),
			sopInstances: {}
		};
		// console.log(maps[studyInstanceUID].series[seriesInstanceUID]);

		//console.log(maps[studyInstanceUID].series[seriesInstanceUID].translation);
		maps[studyInstanceUID].series[seriesInstanceUID].sopInstances[sopInstanceUID] = {
			sopInstanceUID: {
				value: sopInstanceUID,
				translation: anonymizetag(dcm, dictionary.sopInstanceUID)
			},
			patientName: {
				value: dcm.string(dictionary.patientName),
				translation: anonymizetag(dcm, dictionary.patientName)
			},
			patientSex: {
				value: dcm.string(dictionary.patientSex),
				translation: anonymizetag(dcm, dictionary.patientSex)
			},
			patientBirthDate: {
				value: dcm.string(dictionary.patientBirthDate),
				translation: anonymizetag(dcm, dictionary.patientBirthDate)
			},
			protocolName: {
				value: dcm.string(dictionary.protocolName),
				translation: anonymizetag(dcm, dictionary.protocolName)
			},
			patientAge: {
				value: dcm.string(dictionary.patientsAge),
				translation: anonymizetag(dcm, dictionary.patientsAge)
			},
			patientOrinetation: {
				value: dcm.string(dictionary.patientOrientation),
				translation: anonymizetag(dcm, dictionary.patientOrientation)
			},
			studyID: {
				value: dcm.string(dictionary.studyID),
				translation: anonymizetag(dcm, dictionary.studyID)
			},
			studyDate: {
				value: dcm.string(dictionary.studyDate),

				translation: anonymizeDate(dcm, dictionary.studyDate),
			},
			studyTime: {
				value: dcm.string(dictionary.studyTime),
				translation: anonymizeTime(dcm, dictionary.studyTime)
			},
			seriesNumber: {
				value: dcm.string(dictionary.seriesNumber),
				translation: anonymizetag(dcm, dictionary.seriesNumber)
			},
			seriesDate: {
				value: dcm.string(dictionary.seriesDate),
				translation: anonymizeDate(dcm, dictionary.seriesDate)
			},
			seriesTime: {
				value: dcm.string(dictionary.seriesTime),
				translation: anonymizeTime(dcm, dictionary.seriesTime)
			},
			bodyPartExamined: {
				value: dcm.string(dictionary.bodyPartExamined),
				translation: anonymizetag(dcm, dictionary.bodyPartExamined)
			},
			seriesDescription: {
				value: dcm.string(dictionary.seriesDescription),
				translation: anonymizetag(dcm, dictionary.seriesDescription)
			},
			acquistionDate: {
				value: dcm.string(dictionary.acquisitionDate),
				translation: anonymizeDate(dcm, dictionary.acquisitionDate)
			},
			acquistionTime: {
				value: dcm.string(dictionary.acquistionTime),
				translation: anonymizeTime(dcm, dictionary.acquistionTime)
			},
			manufacturer: {
				value: dcm.string(dictionary.manufacturer),
				translation: anonymizetag(dcm, dictionary.manufacturer)
			},
			ManufacturersModelName: {
				value: dcm.string(dictionary.ManufacturersModelName),
				translation: anonymizetag(dcm, dictionary.ManufacturersModelName)
			},
			ReferringPhysicianName: {
				value: dcm.string(dictionary.ReferringPhysicianName),
				translation: anonymizetag(dcm, dictionary.ReferringPhysicianName)
			},

		};
		add_entry(studyInstanceUID, seriesInstanceUID, sopInstanceUID);

		return bytearray;
    
		
	}

	function anonymizetag(dicom, tag) {
		let element = dicom.elements[tag];
		let value = dicom.string(tag);
		if (value !== undefined) {
			let newValue = hash_name(dicom.string(tag));
			if (element)
				dicom.byteArray.write(newValue, element.dataOffset, element.length);
			return dicom.string(tag);
		}
	}

	function anonymizeDate(dicom,tag){
		let element = dicom.elements[tag];
		let value =dicom.string(tag);
		if(value !== undefined){
			let newValue = current_date(dicom.string(tag));
			if (element)
				dicom.byteArray.write(newValue, element.dataOffset, element.length);
			return dicom.string(tag);
		}
	}
	function anonymizeTime(dicom,tag){
		let element = dicom.elements[tag];
		let value =dicom.string(tag);
		if(value !== undefined){
			let newValue = current_time(dicom.string(tag));
			if (element)
				dicom.byteArray.write(newValue, element.dataOffset, element.length);
			return dicom.string(tag);
		}
	}
	return anonymize;
}

function anonymizeSecond(dcm) {
	for (let tag in dictionary){
		if (!dictionary.hasOwnProperty(tag)) continue;
	}
	return dcm.byteArray;
}

module.exports = {
	init: init,
};

function hash_name(name) {
	var md5 = node_crypto.createHash("md5");
	md5.update(name);
	var hash = md5.digest().toString("hex");
	return hash;
}

function pad(num, size) {
	var s = num+"";
	while (s.length < size) s = "0" + s;
	return s;
}
function current_date () {
	var now = new Date();
	return now.getYear() + 1900 + pad(now.getMonth() + 1, 2) + pad(now.getDate(), 2);

}
function current_time () {
	var now = new Date();
	return pad(now.getHours(), 2) + pad(now.getMinutes(), 2) + pad(now.getSeconds(), 2);
}