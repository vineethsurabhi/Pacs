const fs = require("fs");
const tar = require("tar-stream");
const Anonymizer = require("./integrate.js");

anonPipe = new Anonymizer({
		filepath: "./testinput";


    function anonymize(filebuffer) {
    var dcm = dicomParser.parseDicom(filebuffer);


    var studyid = dcm.string(dictionary.studyInstanceUID);
    if (!maps[studyid]) {
        maps[studyid] = {
            translation: anonymizetag(dcm, dictionary.studyInstanceUID),
            series: {}
        }
    }

    var seriesid = dcm.string(dictionary.seriesUID);
    if (!maps[studyid].series[seriesid]) {
        maps[studyid].series[seriesid] = {
            translation: anonymizetag(dcm, dictionary.seriesUID),
            sopInstances: {}
        }
    }


    var sopInstanceId = dcm.string(dictionary.sopClassUID);
    if (!maps[studyid].series[seriesid].sopInstances[sopInstanceId]) {

        maps[studyid].series[seriesid].sopInstances[sopInstanceId] = {
            sopInstanceUID: {
                value: sopInstanceId,
                translation: anonymizetag(dcm, dictionary.sopClassUID)
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
            instanceUID: {
                value: dcm.string(dictionary.instanceUID),
                translation: anonymizetag(dcm, dictionary.instanceUID),

            }
        };


    }




    return dcm.byteArray;

};

anonPipe.pipe(fs.createWriteStream("testout.tar"));

// output should be