const SHEET_NAME = "SurveyData";

const DRIVE_FOLDER_NAME =
    "Library Survey Photos";


function getSheet() {

    const spreadsheet =
        SpreadsheetApp.getActiveSpreadsheet();

    let sheet =
        spreadsheet.getSheetByName(
            SHEET_NAME
        );


    if (!sheet) {

        sheet =
            spreadsheet.insertSheet(
                SHEET_NAME
            );

        sheet.appendRow([
            "id",
            "userId",
            "userEmail",
            "userName",
            "interviewTime",
            "interviewer",
            "major",
            "year",
            "gender",
            "age",
            "latitude",
            "longitude",
            "accuracy",
            "awareness",
            "space",
            "lighting",
            "furniture",
            "wifi",
            "cleanliness",
            "usage",
            "purpose",
            "overall",
            "comment",
            "photoUrl",
            "createdAt",
            "syncedAt"
        ]);
    } else {

        const headers = sheet
            .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
            .getValues()[0];

        if (!headers.includes("userEmail")) {
            sheet.insertColumnsAfter(1, 3);
            sheet.getRange(1, 2, 1, 3).setValues([[
                "userId",
                "userEmail",
                "userName"
            ]]);
        }
    }

    return sheet;
}


function getDriveFolder() {

    const folders =
        DriveApp.getFoldersByName(
            DRIVE_FOLDER_NAME
        );

    if (folders.hasNext()) {

        return folders.next();
    }

    return DriveApp.createFolder(
        DRIVE_FOLDER_NAME
    );
}


function doGet(e) {

    if (
        e &&
        e.parameter &&
        e.parameter.action === "analytics"
    ) {
        return jsonResponse(getAnalytics());
    }

    return ContentService
        .createTextOutput(
            JSON.stringify({
                success: true,
                message:
                    "Library Survey API is running."
            })
        )
        .setMimeType(
            ContentService.MimeType.JSON
        );
}


function getAnalytics() {

    const sheet = getSheet();
    const values = sheet.getDataRange().getValues();

    if (values.length < 2) {
        return {
            success: true,
            total: 0,
            awareness: {},
            purpose: {},
            major: {},
            ratings: {},
            updatedAt: new Date().toISOString()
        };
    }

    const headers = values[0].map(header => String(header).trim());
    const columns = {};

    headers.forEach((header, index) => {
        columns[header] = index;
    });

    const rows = values.slice(1).filter(row => row[columns.id]);
    const awareness = {};
    const purpose = {};
    const major = {};
    const ratingFields = [
        ["space", "Không gian"],
        ["lighting", "Ánh sáng"],
        ["furniture", "Bàn ghế"],
        ["wifi", "Wifi"],
        ["cleanliness", "Vệ sinh"],
        ["overall", "Hài lòng chung"]
    ];
    const ratingTotals = {};
    const ratingCounts = {};

    function addCount(target, value) {
        if (!value) return;
        target[value] = (target[value] || 0) + 1;
    }

    rows.forEach(row => {

        addCount(awareness, row[columns.awareness]);
        addCount(major, row[columns.major]);

        String(row[columns.purpose] || "")
            .split(",")
            .map(value => value.trim())
            .filter(Boolean)
            .forEach(value => addCount(purpose, value));

        ratingFields.forEach(([field, label]) => {

            const value = Number(row[columns[field]]);

            if (!value) return;

            ratingTotals[label] = (ratingTotals[label] || 0) + value;
            ratingCounts[label] = (ratingCounts[label] || 0) + 1;
        });
    });

    const ratings = {};

    ratingFields.forEach(([, label]) => {
        ratings[label] = ratingCounts[label]
            ? Number((ratingTotals[label] / ratingCounts[label]).toFixed(2))
            : 0;
    });

    return {
        success: true,
        total: rows.length,
        awareness,
        purpose,
        major,
        ratings,
        updatedAt: new Date().toISOString()
    };
}


function doPost(e) {

    try {

        const data =
            JSON.parse(
                e.postData.contents
            );


        const sheet =
            getSheet();


        /*
         * Prevent duplicate records
         */

        const values =
            sheet.getDataRange()
                .getValues();


        const existing =
            values.some(
                row =>
                    row[0] === data.id
            );


        if (existing) {

            return jsonResponse({
                success: true,
                duplicate: true,
                photoUrl: ""
            });
        }


        /*
         * Upload photo
         */

        let photoUrl = "";


        if (
            data.photo &&
            data.photo.startsWith(
                "data:image/"
            )
        ) {

            const folder =
                getDriveFolder();


            const parts =
                data.photo.split(",");


            const mimeMatch =
                data.photo.match(
                    /^data:(image\/[^;]+)/
                );


            const mimeType =
                mimeMatch
                    ? mimeMatch[1]
                    : "image/jpeg";


            const bytes =
                Utilities.base64Decode(
                    parts[1]
                );


            const blob =
                Utilities.newBlob(
                    bytes,
                    mimeType,
                    `${data.id}.jpg`
                );


            const file =
                folder.createFile(
                    blob
                );


            photoUrl =
                file.getUrl();
        }


        /*
         * Location
         */

        const location =
            data.location || {};


        /*
         * Respondent
         */

        const respondent =
            data.respondent || {};


        const user =
            data.user || {};


        /*
         * Answers
         */

        const answers =
            data.answers || {};


        /*
         * Save row
         */

        sheet.appendRow([

            data.id || "",

            user.id || "",

            user.email || "",

            user.name || "",

            data.interviewTime || "",

            data.interviewer || "",

            respondent.major || "",

            respondent.year || "",

            respondent.gender || "",

            respondent.age || "",

            location.latitude || "",

            location.longitude || "",

            location.accuracy || "",

            answers.awareness || "",

            answers.space || "",

            answers.lighting || "",

            answers.furniture || "",

            answers.wifi || "",

            answers.cleanliness || "",

            answers.usage || "",

            Array.isArray(
                answers.purpose
            )
                ? answers.purpose.join(", ")
                : "",

            answers.overall || "",

            answers.comment || "",

            photoUrl,

            data.createdAt || "",

            new Date().toISOString()

        ]);


        return jsonResponse({

            success: true,

            message:
                "Data synchronized successfully.",

            photoUrl:
                photoUrl

        });


    } catch (error) {

        return jsonResponse({

            success: false,

            error:
                error.toString()

        });
    }
}


function jsonResponse(data) {

    return ContentService
        .createTextOutput(
            JSON.stringify(data)
        )
        .setMimeType(
            ContentService.MimeType.JSON
        );
}