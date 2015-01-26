/**
 * Created by jsinai on 1/24/15.
 */

function initCat(cat) {
    if (!cat || typeof cat == 'undefined') {
        // This should never happen
        console.log("=== Decode cat: undefined cat, starting from scratch");
        cat = {
            // Items stored in rescuegroups fields
            animalAltered: false,
            animalName: "",
            animalBirthdate: "",
            animalSex: "",
            animalColor: "",
            animalBreed: "",
            animalCoatLength: "Short",
            animalMicrochipVendor: "",
            animalMicrochipNumber: "",
            animalNotes: ""
        };
    }
    cat.version = "1.0.0";
    cat.age = "";
    cat.weight = "";
    cat.source = "";
    cat.whereAltered = "";
    cat.declawed = {front: false, back: false};
    cat.felvTest = {result: "", date: "", alerts: []};
    cat.fivTest = {result: "", date: "", alerts: []};
    cat.vaccinations = [
        {name: "", date: "", alerts: []}
    ];
    return cat;
}
self.addEventListener('message', function (e) {
    // TODO: keep this constant in sync with services.js
    var originNotesWarning = '== DO NOT EDIT THIS FIELD == ';
    var cat = e.data;
    // Decode our private fields (keep in sync with addEditCatService)
    try {
        if (cat.animalOrigin) {
            var encodedCat = cat.animalOrigin;
            var startEncodedCat = cat.animalOrigin.indexOf(originNotesWarning);
            if (startEncodedCat > -1) {
                encodedCat = cat.animalOrigin.substring(originNotesWarning.length);
            }
            // Remove spaces
            encodedCat = encodedCat.replace(/ /g, '');
            var decodedCat = null;
            try {
                decodedCat = atob(encodedCat);
            } catch (e) {
                // This can happen for older cats
                console.log("=== Decode atob error for cat", cat.animalName, encodedCat);
            }
            var jsonCat = null;
            try {
                jsonCat = decodedCat ? JSON.parse(decodedCat) : undefined;
            } catch (e) {
                // This can happen for older cats
                console.log("=== Decode JSON.parse error for cat", cat.animalName, decodedCat);
            }
            cat.version = jsonCat ? jsonCat.version : null;
            if (!cat.version) {
                // Something else was in the origin notes, so they are invalid
                // Move the origin notes to the animalNotes and start fresh
                cat.animalNotes = cat.animalNotes + "\r" + cat.animalOrigin;
                initCat(cat);
            } else {
                cat.age = jsonCat.age;
                cat.weight = jsonCat.weight;
                cat.source = jsonCat.source;
                cat.whereAltered = jsonCat.whereAltered;
                cat.declawed = jsonCat.declawed;
                if (cat.animalDeclawed === "Yes" && !(cat.declawed.front || cat.declawed.back)) {
                    // If animalDeclawed is set, make sure that at least one of declawed front or back is set.
                    cat.declawed.front = true;
                }
                if (!cat.declawed) {
                    // Just in case
                    cat.declawed = {front: false, back: false};
                }
                cat.felvTest = jsonCat.felvTest;
                if (!cat.felvTest) {
                    cat.felvTest = {result: "", date: "", alerts: []};
                }
                if (!cat.felvTest.date) {
                    cat.felvTest.date = "";
                }
                cat.fivTest = jsonCat.fivTest;
                if (!cat.fivTest) {
                    cat.fivTest = {result: "", date: "", alerts: []};
                }
                if (!cat.fivTest.date) {
                    cat.fivTest.date = "";
                }
                cat.vaccinations = jsonCat.vaccinations;
                if (cat.vaccinations.length < 1) {
                    cat.vaccinations.push({name: "", date: "", alerts: []});
                } else {
                    cat.vaccinations.forEach(function (vaccination) {
                        vaccination.date = new Date(vaccination.date);
                    });
                }
            }
        } else {
            cat = initCat(cat);
        }
        // Do some transformations
        cat.felvTest.date = new Date(cat.felvTest.date);
        cat.fivTest.date = new Date(cat.fivTest.date);
    } catch (e) {
        // This can happen for older cats
        console.log("=== Unknown decode error for cat", cat.animalName, e);
    }
    self.postMessage(cat);
    // Terminate the worker.
    self.close();
}, false);
