const dicomParser = require("dicom-parser");
const node_crypto = require("crypto");

const dictionary = {
	//patient information
	patientID: "x00100020",
	patientName:"x00100010",
	patientSex :"x00100040",
	patientBirthDate:"x00100030",
	protocolName:"x0018130",
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
	bodyPart:"x00180015",
	seriesdescription:"x0008103e",
	// instance information
	acquisitionDate:"x00080022",
	acquistionTime:"x00080032",
	//Equipment information
	manufacturer:"x00080070",
	model:"x00081090",
	physiciansName :"x0080090",
	//UID information
	studyInstanceUID:"x0020000d",
	seriesUID:"x0020000e",
	instanceUID:"x00080018",
	sopClassUID:"x00080016",
};

function init(options, db) {
	let maps = {};

	db.run("CREATE TABLE IF NOT EXISTS userInterface(id INTEGER , userID varchar(100) ,studyInstanceUID varchar(100) PRIMARY KEY)");
	db.run("CREATE TABLE IF NOT EXISTS studyInterface(id INTEGER PRIMARY KEY AUTOINCREMENT,studyInstanceUID varchar(100) , anonStudyInstanceUID varchar(100),seriesInstanceUID varchar(100) ,anonSeriesInstanceUID varchar(100), sopInstanceUID varchar(100) , anonSopInstanceUID varchar(100),FOREIGN KEY(studyInstanceUID) REFERENCES userInterface(studyInstanceUID))");
	db.run("CREATE TABLE IF NOT EXISTS tags(id INTEGER PRIMARY KEY AUTOINCREMENT,anonSopInstanceUID varchar(100),tagName varchar(100), oldValue varchar(1000),anonValue varchar(1000) ,FOREIGN KEY(anonSopInstanceUID) REFERENCES studyInterface(anonSopInstanceUID))");


	function add_entry(studyInstanceUID, seriesInstanceUID, InstanceID) {
		db.serialize(function () {
			let stmt0 = db.prepare("INSERT or REPLACE into userInterface(userID,studyInstanceUID) values(?,?)");
			stmt0.run(localStorage.getItem("user"),studyInstanceUID);
			stmt0.finalize();
			let stmt1 = db.prepare("INSERT or REPLACE into studyInterface(studyInstanceUID,AnonStudyInstanceUID,seriesInstanceUID,AnonSeriesInstanceUID,sopInstanceUID,AnonSopInstanceUID) values(?,?,?,?,?,?)");
			stmt1.run(studyInstanceUID, maps[studyInstanceUID].translation, seriesInstanceUID, maps[studyInstanceUID].series[seriesInstanceUID].translation, InstanceID, maps[studyInstanceUID].series[seriesInstanceUID].sopInstances[InstanceID].InstanceUID.translation);
			stmt1.finalize();
			let stmt2 = db.prepare("INSERT or REPLACE into tags(AnonSopInstanceUID,tagName,oldValue,anonValue) values(?,?, ?,?)");
			let instance = maps[studyInstanceUID].series[seriesInstanceUID].sopInstances[InstanceID];
			for (let tag in instance) {
				if (!instance.hasOwnProperty(tag)) continue;
				stmt2.run(instance.InstanceUID.translation, tag, instance[tag].value, instance[tag].translation);
			}
			stmt2.finalize();
		});
	}

	function anonymize(filebuffer) {
		let dcm = dicomParser.parseDicom(filebuffer);
		let studyid = dcm.string(dictionary.studyInstanceUID);
		let seriesid = dcm.string(dictionary.seriesUID);
		let InstanceId = dcm.string(dictionary.instanceUID);
		if (!maps[studyid]) {
			maps[studyid] = {
				translation: anonymizetag(dcm, dictionary.studyInstanceUID),
				series: {}
			};
			if (!maps[studyid].series[seriesid])  {
				maps[studyid].series[seriesid] = {
					translation: anonymizetag(dcm, dictionary.seriesUID),
					sopInstances: {}
				};
				if (!maps[studyid].series[seriesid].sopInstances[InstanceId]) {
					maps[studyid].series[seriesid].sopInstances[InstanceId] = {
						InstanceUID: {
							value: InstanceId,
							translation: anonymizetag(dcm, dictionary.instanceUID)
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
							translation: anonymizetag(dcm, dictionary.studyDate),
						},
						studyTime: {
							value: dcm.string(dictionary.studyTime),
							translation: anonymizetag(dcm, dictionary.studyTime)
						},
						seriesNumber: {
							value: dcm.string(dictionary.seriesNumber),
							translation: anonymizetag(dcm, dictionary.seriesNumber)
						},
						seriesDate: {
							value: dcm.string(dictionary.seriesDate),
							translation: anonymizetag(dcm, dictionary.seriesDate)
						},
						seriesTime: {
							value: dcm.string(dictionary.seriesTime),
							translation: anonymizetag(dcm, dictionary.seriesTime)
						},
						bodyPart: {
							value: dcm.string(dictionary.bodyPart),
							translation: anonymizetag(dcm, dictionary.bodyPart)
						},
						seriesDescription: {
							value: dcm.string(dictionary.seriesdescription),
							translation: anonymizetag(dcm, dictionary.seriesdescription)
						},
						acquistionDate: {
							value: dcm.string(dictionary.acquisitionDate),
							translation: anonymizetag(dcm, dictionary.acquisitionDate)
						},
						acquistionTime: {
							value: dcm.string(dictionary.acquistionTime),
							translation: anonymizetag(dcm, dictionary.acquistionTime)
						},
						manufacturer: {
							value: dcm.string(dictionary.manufacturer),
							translation: anonymizetag(dcm, dictionary.manufacturer)
						},
						model: {
							value: dcm.string(dictionary.model),
							translation: anonymizetag(dcm, dictionary.model)
						},
						physiciansName: {
							value: dcm.string(dictionary.physiciansName),
							translation: anonymizetag(dcm, dictionary.physiciansName)
						},
					};
					add_entry(studyid, seriesid, InstanceId);
				}
			}
			return dcm.byteArray;
		}


		let bytearray = anonymizeSecond(dcm);
		maps[studyid] = {
			translation: anonymizetag(dcm, dictionary.studyInstanceUID),
			series: {}
		};
		maps[studyid].series[seriesid] = {
			translation: anonymizetag(dcm, dictionary.seriesUID),
			sopInstances: {}
		};
		maps[studyid].series[seriesid].sopInstances[InstanceId] = {
			InstanceUID: {
				value: InstanceId,
				translation: anonymizetag(dcm, dictionary.instanceUID)
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

				translation: anonymizetag(dcm, dictionary.studyDate),
			},
			studyTime: {
				value: dcm.string(dictionary.studyTime),
				translation: anonymizetag(dcm, dictionary.studyTime)
			},
			seriesNumber: {
				value: dcm.string(dictionary.seriesNumber),
				translation: anonymizetag(dcm, dictionary.seriesNumber)
			},
			seriesDate: {
				value: dcm.string(dictionary.seriesDate),
				translation: anonymizetag(dcm, dictionary.seriesDate)
			},
			seriesTime: {
				value: dcm.string(dictionary.seriesTime),
				translation: anonymizetag(dcm, dictionary.seriesTime)
			},
			bodyPart: {
				value: dcm.string(dictionary.bodyPart),
				translation: anonymizetag(dcm, dictionary.bodyPart)
			},
			seriesDescription: {
				value: dcm.string(dictionary.seriesdescription),
				translation: anonymizetag(dcm, dictionary.seriesdescription)
			},
			acquistionDate: {
				value: dcm.string(dictionary.acquisitionDate),
				translation: anonymizetag(dcm, dictionary.acquisitionDate)
			},
			acquistionTime: {
				value: dcm.string(dictionary.acquistionTime),
				translation: anonymizetag(dcm, dictionary.acquistionTime)
			},
			manufacturer: {
				value: dcm.string(dictionary.manufacturer),
				translation: anonymizetag(dcm, dictionary.manufacturer)
			},
			model: {
				value: dcm.string(dictionary.model),
				translation: anonymizetag(dcm, dictionary.model)
			},
			physiciansName: {
				value: dcm.string(dictionary.physiciansName),
				translation: anonymizetag(dcm, dictionary.physiciansName)
			},


		};
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

/*function makeRandomString(tag)
{
	let name = tag.toString();
	let text = "";
	let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01" +
    "23456789";

	for( let i=0; i < name.length; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}*/





