'use strict';

catsApp.constant('rgApi', 'https://api.rescuegroups.org/http/json');
//catsApp.constant('rgApi', 'http://test-api.rescuegroups.org/http/json');
catsApp.constant('originNotesWarning', '== DO NOT EDIT THIS FIELD == ');

catsApp.factory('catServicesHolder',
    function ($log, $filter, $location, catState, getCatNamesService, getBreedsService, getColorsService,
              getMicrochipVendorsService, catUtils, addEditCatService, getStatusesService, growl) {
        return {
            catState: catState,
            getCatNamesService: getCatNamesService,
            getBreedsService: getBreedsService,
            getColorsService: getColorsService,
            getMicrochipVendorsService: getMicrochipVendorsService,
            catUtils: catUtils,
            addEditCatService: addEditCatService,
            getStatusesService: getStatusesService,
            growl: growl
        };
    });
catsApp.service('addEditCatService',
    function ($http, rgApi, catUtils, originNotesWarning ) {
        this.addEditCat = function (token, tokenHash, cat, isEdit) {
            // Encode our private fields (keep in sync with editIntakeController)
            var catToEncode = {
                version: cat.version,
                age: cat.age,
                weight: cat.weight,
                source: cat.source,
                whereAltered: cat.whereAltered,
                declawed: cat.declawed,
                felvTest: cat.felvTest,
                fivTest: cat.fivTest,
                vaccinations: cat.vaccinations
            };
            // base-64 encode to discourage editing on rescue groups site
            var longCat = btoa(JSON.stringify(catToEncode));
            // Split into 50 char segments to make it wrap on the rescue groups site
            var splits = longCat.match(/.{1,50}/g);
            var joinedCat = splits.join(' ');
            // Add a warning to discourage editing on rescue groups site
            var encodedCat = originNotesWarning + joinedCat;
            var description = isEdit ?
                cat.animalDescriptionPlain :
                cat.animalName + " (DOB " + catUtils.getFormattedDate(cat.animalBirthdate) + ") is a " +
                cat.animalBreed;
            var postData = {
                "token": token,
                "tokenHash": tokenHash,
                "objectType": "animals",
                "values": [
                    {
                        "animalAltered": cat.animalAltered,
                        "animalBirthdate": catUtils.getFormattedDate(cat.animalBirthdate),
                        "animalColorID": cat.animalColorID,
                        "animalCoatLength": cat.animalCoatLength,
                        "animalDescription": description,
                        "animalMicrochipNumber": cat.animalMicrochipNumber,
                        "animalMicrochipVendor": cat.animalMicrochipVendor,
                        "animalName": cat.animalName,
                        "animalNotes": cat.animalNotes,
                        "animalOrigin": encodedCat,
                        "animalPrimaryBreedID": cat.animalPrimaryBreedID,
                        "animalReceivedDate": catUtils.getFormattedDate(cat.animalReceivedDate),
                        "animalSex": cat.animalSex,
                        "animalDeclawed": (cat.declawed.front || cat.declawed.back) ? "Yes" : "No",
                        "animalSpeciesID": "Cat",
                        "animalStatusID": cat.animalStatusID
                    }
                ]};
            if (isEdit) {
                postData.objectAction = "edit";
                postData.values[0].animalID = cat.animalID;
            } else {
                postData.objectAction = "add";
            }
            return $http({
                method: 'POST',
                url: rgApi,
                data: postData
            })
        }
    });
catsApp.service('getAllCats',
    function ($http, rgApi, catState) {
        this.getData = function (status) {
            var postData =
            {
                "token": catState.getState().token,
                "tokenHash": catState.getState().tokenHash,
                "objectType": "animals",
                "objectAction": "search",
                "search": {
                    "calcFoundRows": "Yes",
                    "resultStart": 0,
                    "resultLimit": 500,
                    "resultSort": "animalName",
                    "resultOrder": "asc",
                    "fields": [
                        "animalID",
                        "animalBreed",
                        "animalColor",
                        "animalMicrochipNumber",
                        "animalName",
                        "animalOrigin",
                        "animalPictures",
                        "animalSex",
                        "animalStatus",
                        "locationName"
                    ],
                    "filters": [
                        {
                            "fieldName": "animalOrgID",
                            "operation": "equals",
                            "criteria": "910"
                        }
                    ]
                }
            };
            var orCriteria = [];
            angular.forEach(status, function (value, key) {
                if (value.selected) {
                    postData.search.filters.push(
                        {
                            "fieldName": "animalStatus",
                            "operation": "equals",
                            "criteria": value.rgStr
                        }
                    );
                    orCriteria.push((orCriteria.length + 2).toString());
                }
            });
            postData.search.filterProcessing = "1 and (" + orCriteria.join(" or ") + ")";
            return $http({
                method: 'POST',
                url: rgApi,
                data: postData
            })
        }
    }
);
catsApp.service('getOneCat',
    function ($http, rgApi) {
        this.getData = function (catId, catState) {
            var postData =
            {
                "token": catState.getState().token,
                "tokenHash": catState.getState().tokenHash,
                "objectType": "animals",
                "objectAction": "search",
                "search": {
                    "calcFoundRows": "Yes",
                    "resultStart": 0,
                    "resultLimit": 1,
                    "fields": [
                        "animalAltered",
                        "animalBirthdate",
                        "animalBreed",
                        "animalCoatLength",
                        "animalColor",
                        "animalColorID",
                        "animalDeclawed",
                        "animalDescriptionPlain",
                        "animalEyeColor",
                        "animalGeneralAge",
                        "animalID",
                        "animalMicrochipNumber",
                        "animalMicrochipVendor",
                        "animalName",
                        "animalNotes",
                        "animalOrigin",
                        "animalPattern",
                        "animalPrimaryBreedID",
                        "animalReceivedDate",
                        "animalSex",
                        "animalSpecialneeds",
                        "animalSpecies",
                        "animalStatus",
                        "animalStatusID",
                        "locationName"
                    ],
                    "filters": [
                        {
                            "fieldName": "animalID",
                            "operation": "equals",
                            "criteria": catId
                        },
                        {
                            "fieldName": "animalOrgID",
                            "operation": "equals",
                            "criteria": "910"
                        }
                    ]
                }
            };
            return $http({
                method: 'POST',
                url: rgApi,
                data: postData
            })
        }
    }
);
catsApp.service('findCatByName',
    function ($http, rgApi, catState) {
        this.getData = function (catName) {
            var postData =
            {
                "token": catState.getState().token,
                "tokenHash": catState.getState().tokenHash,
                "objectType": "animals",
                "objectAction": "search",
                "search": {
                    "calcFoundRows": "Yes",
                    "resultStart": 0,
                    "resultLimit": 100,
                    "fields": [
                        "animalID",
                        "animalBreed",
                        "animalColor",
                        "animalMicrochipNumber",
                        "animalName",
                        "animalOrigin",
                        "animalPictures",
                        "animalSex",
                        "animalStatus",
                        "locationName"
                    ],
                    "filters": [
                        {
                            "fieldName": "animalName",
                            "operation": "equals",
                            "criteria": catName
                        },
                        {
                            "fieldName": "animalOrgID",
                            "operation": "equals",
                            "criteria": "910"
                        }
                    ]
                }
            };
            return $http({
                method: 'POST',
                url: rgApi,
                data: postData
            })
        }
    }
);
catsApp.service('findCatByTypeahead',
    function ($http, rgApi, catState) {
        this.getData = function (catName) {
            var postData =
            {
                "token": catState.getState().token,
                "tokenHash": catState.getState().tokenHash,
                "objectType": "animals",
                "objectAction": "search",
                "search": {
                    "calcFoundRows": "Yes",
                    "resultStart": 0,
                    "resultLimit": 10,
                    "fields": [
                        "animalID",
                        "animalName"
                    ],
                    "filters": [
                        {
                            "fieldName": "animalOrgID",
                            "operation": "equals",
                            "criteria": "910"
                        },
                        {
                            "fieldName": "animalName",
                            "operation": "contains",
                            "criteria": catName
                        }
                    ]
                }
            };
            return $http({
                method: 'POST',
                url: rgApi,
                data: postData
            })
        }
    }
);
catsApp.service('getCatNamesService',
    function ($http, rgApi, catState) {
        this.getData = function () {
            var postData =
            {
                "token": catState.getState().token,
                "tokenHash": catState.getState().tokenHash,
                "objectType": "animals",
                "objectAction": "search",
                "search": {
                    "calcFoundRows": "Yes",
                    "resultStart": 0,
                    "resultLimit": 1000,
                    "fields": [
                        "animalName"
                    ],
                    "filterProcessing": "(1 or 2 or 3 or 4) and 5",
                    "filters": [
                        {
                            "fieldName": "animalStatus",
                            "operation": "equals",
                            "criteria": "Available"
                        },
                        {
                            "fieldName": "animalStatus",
                            "operation": "equals",
                            "criteria": "Not Available"
                        },
                        {
                            "fieldName": "animalStatus",
                            "operation": "equals",
                            "criteria": "Hold"
                        },
                        {
                            "fieldName": "animalStatus",
                            "operation": "equals",
                            "criteria": "Treatment"
                        },
                        {
                            "fieldName": "animalOrgID",
                            "operation": "equals",
                            "criteria": "910"
                        }

                    ]
                }
            };
            return $http({
                method: 'POST',
                url: rgApi,
                data: postData
            })
        }
    }
);
catsApp.service('getBreedsService',
    function ($http, rgApi, catState) {
        this.getData = function () {
            var postData =
            {
                "token": catState.getState().token,
                "tokenHash": catState.getState().tokenHash,
                "objectType": "animalBreeds",
                "objectAction": "search",
                "search": {
                    "calcFoundRows": "Yes",
                    "resultStart": 0,
                    "resultLimit": 500,
                    "fields": [
                        "breedID",
                        "species",
                        "breedName"
                    ],
                    "filters": [
                        {
                            "fieldName": "species",
                            "operation": "equals",
                            "criteria": "Cat"
                        }
                    ]
                }
            };
            return $http({
                method: 'POST',
                url: rgApi,
                data: postData
            })
        }
    }
);
catsApp.service('getColorsService',
    function ($http, rgApi) {
        this.getData = function (token, tokenHash) {
            var postData =
            {
                "apikey": "JrxyBdcw",
                "objectType": "animalColors",
                "objectAction": "publicList",
                "search": {
                    "calcFoundRows": "Yes",
                    "resultStart": 0,
                    "resultLimit": 500,
                    "fields": [
                        "animalColors"
                    ]
                }
            };
            return $http({
                method: 'POST',
                url: rgApi,
                data: postData
            })
        }
    }
);
catsApp.service('getMicrochipVendorsService',
    function ($http, rgApi) {
        this.getData = function (catState) {
            var postData =
            {
                "token": catState.getState().token,
                "tokenHash": catState.getState().tokenHash,
                "objectType": "microchipVendors",
                "objectAction": "list",
                "search": {
                    "calcFoundRows": "Yes",
                    "resultStart": 0,
                    "resultLimit": 500,
                    "fields": [
                        "microchipVendors"
                    ]
                }
            };
            return $http({
                method: 'POST',
                url: rgApi,
                data: postData
            })
        }
    }
);
catsApp.service('getStatusesService',
    function ($http, rgApi, catState) {
        this.getData = function () {
            var postData =
            {
                "token": catState.getState().token,
                "tokenHash": catState.getState().tokenHash,
                "objectType": "animalStatuses",
                "objectAction": "list",
                "search": {
                    "calcFoundRows": "Yes",
                    "resultStart": 0,
                    "resultLimit": 100
                }
            };
            return $http({
                method: 'POST',
                url: rgApi,
                data: postData
            })
        }
    }
);
catsApp.service('loginService',
    function ($http, rgApi) {
        this.login = function (username, password, account) {
            var postData =
            {
                "username": username, "password": password, "accountNumber": account, "action": "login"
            };
            return $http({
                method: 'POST',
                url: rgApi,
                data: postData
            })
        }
    }
);
catsApp.service('catUtils',
    function () {
        this.ageFromDate = function (birthDate, intakeDate, defaultAge) {
            if (!birthDate || birthDate.toDateString() === "Invalid Date") {
                return defaultAge;
            }
            var dateToSubtract = intakeDate;
            if (!intakeDate || intakeDate.toDateString() === "Invalid Date") {
                dateToSubtract = new Date();
            }
            var y = dateToSubtract.getFullYear() - birthDate.getFullYear();
            var m = dateToSubtract.getMonth() - birthDate.getMonth();
            if (m < 0) {
                y--;
                m = 12 + m;
            } else if (m < 0 || (m === 0 && dateToSubtract.getDate() < birthDate.getDate())) {
                y--;
            }
            return y + " yrs " + m + " mths";
        };
        this.getFormattedDate = function (date) {
            if (!date || date.toDateString() === "Invalid Date") {
                return undefined;
            }
            var year = date.getFullYear();
            var month = (1 + date.getMonth()).toString();
            month = month.length > 1 ? month : '0' + month;
            var day = date.getDate().toString();
            day = day.length > 1 ? day : '0' + day;
            return month + '/' + day + '/' + year;
        }
    }
);
catsApp.service('catState',
    function (ipCookie) {
        var state = {
            token: "", tokenHash: "",
            status: {
                available: {rgStr: 'Available', selected: true},
                hold: {rgStr: 'Hold', selected: false},
                notAvailable: {rgStr: 'Not Available', selected: false},
                treatment: {rgStr: 'Treatment', selected: false},
                dead: {rgStr: 'Passed Away', selected: false},
                adopted: {rgStr: 'Adopted', selected: false}
            },
            foundCats: []
        };
        if (ipCookie("rgToken") && ipCookie("rgTokenHash")) {
            state.token = ipCookie("rgToken");
            state.tokenHash = ipCookie("rgTokenHash");
        }
        this.getState = function () {
            return state;
        };
        this.setState = function (token, tokenHash) {
            ipCookie("rgToken", token, { expires: 1 });
            ipCookie("rgTokenHash", tokenHash, { expires: 1 });
            state.token = token;
            state.tokenHash = tokenHash;
        };
        this.logout = function () {
            ipCookie.remove("rgToken");
            ipCookie.remove("rgTokenHash");
            state.token = "";
            state.tokenHash = "";
        };
    });
