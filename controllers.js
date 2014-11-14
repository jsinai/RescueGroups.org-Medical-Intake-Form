'use strict';

function medicalIntakeController($scope, $log, $filter, $location, catServicesHolder) {
    $scope.cat = {
        // Items stored in rescuegroups fields
        animalAltered: false,
        animalName: "",
        animalBirthdate: "",
        animalSex: "",
        animalColor: "",
        animalBreed: "",
        animalCoatLength: "",
        animalMicrochipVendor: "",
        animalMicrochipNumber: "",
        animalNotes: "",
        // Items stored in our private, encoded field (origin notes)
        version: "1.0.0",
        age: "",
        weight: "",
        source: "",
        admitted: "",
        whereAltered: "",
        declawed: {front: false, back: false},
        vaccinations: [
            {name: "", date: ""}
        ]
    };
    initAddEdit($scope, $log, $filter, $location, catServicesHolder, false);
}
function editIntakeController($scope, $log, $filter, $location, catServicesHolder, catQueryResult) {
    $scope.cat = {};
    angular.forEach(catQueryResult.data.data, function (cat, key) {
        $scope.cat = cat;
    });
    $scope.initCat = function () {
        $scope.cat.version = "1.0.0";
        $scope.cat.age = "";
        $scope.cat.weight = "";
        $scope.cat.source = "";
        $scope.cat.whereAltered = "";
        $scope.cat.declawed = {front: false, back: false};
        $scope.cat.vaccinations = [
            {name: "", date: ""}
        ];
    };
    // Decode our private fields (keep in sync with addEditCatService)
    if ($scope.cat.animalOrigin) {
        var encodedCat = atob($scope.cat.animalOrigin);
        var decodedCat = encodedCat ? JSON.parse(encodedCat) : undefined;
        $scope.cat.version = decodedCat ? decodedCat.version : undefined;
        if (!$scope.cat.version) {
            // Something else was in the origin notes, so they are invalid
            // Move the origin notes to the animalNotes and start fresh
            $scope.cat.animalNotes = $scope.cat.animalNotes + "\r" + $scope.cat.animalOrigin;
            $scope.initCat();
        } else {
            $scope.cat.age = decodedCat.age;
            $scope.cat.weight = decodedCat.weight;
            $scope.cat.source = decodedCat.source;
            $scope.cat.whereAltered = decodedCat.whereAltered;
            $scope.cat.declawed = decodedCat.declawed;
            if ($scope.cat.animalDeclawed && !($scope.cat.declawed.front || $scope.cat.declawed.back)) {
                // If animalDeclawed is set, make sure that at least one of declawed front or back is set.
                $scope.cat.declawed.front = true;
            }
            $scope.cat.vaccinations = decodedCat.vaccinations;
            if ($scope.cat.vaccinations.length < 1) {
                $scope.cat.vaccinations.push({name: "", date: ""});
            } else {
                $scope.cat.vaccinations.forEach(function (vaccination) {
                    vaccination.date = new Date(vaccination.date);
                });
            }
        }
    } else {
        $scope.initCat();
    }
    // Do some transformations
    $scope.cat.animalReceivedDate = new Date($scope.cat.animalReceivedDate);
    $scope.cat.animalBirthdate = new Date($scope.cat.animalBirthdate);
    initAddEdit($scope, $log, $filter, $location, catServicesHolder, true);
}
function initAddEdit($scope, $log, $filter, $location, catServicesHolder, isEdit) {
    $scope.setDob = function () {
        $scope.cat.age = catServicesHolder.catUtils.ageFromDate($scope.cat.animalBirthdate, $scope.cat.age);
    };
    $scope.cat.age = $scope.cat.animalBirthdate ?
        catServicesHolder.catUtils.ageFromDate($scope.cat.animalBirthdate, $scope.cat.age) : "";

    $scope.addVaccination = function () {
        $scope.cat.vaccinations.push({name: "", date: ""});
    };
    $scope.removeVaccination = function (vaccinationIndex) {
        if (vaccinationIndex > 0) {
            $scope.cat.vaccinations.splice(vaccinationIndex, 1);
        }
    };
    $scope.setBreed = function () {
        $scope.cat.animalBreed = $scope.selectedBreed.breedName;
        $scope.cat.animalPrimaryBreedID = $scope.selectedBreed.breedID;
    };
    $scope.setStatus = function () {
        $scope.cat.animalStatus = $scope.selectedStatus.name;
        $scope.cat.animalStatusID = $scope.selectedStatus.id;
    };
    $scope.saveCat = function (isValid) {
        if (!isValid) {
            // The user should never see this, it's a fail-safe.
            alert("There is an error on the form. Please check the information entered.");
            return;
        }
        $scope.validateCat();

        $log.info("Name: " + $scope.cat.animalName);
        $log.info("Age: " + $scope.cat.age);
        $log.info("DOB: " + $scope.cat.animalBirthdate);
        $log.info("Gender: " + $scope.cat.animalSex);
        $log.info("Weight: " + $scope.cat.weight);
        $log.info("Color: " + $scope.cat.animalColor);
        $log.info("Breed: " + $scope.cat.animalBreed);
        $log.info("Coat Length: " + $scope.cat.animalCoatLength);
        $log.info("Source: " + $scope.cat.source);
        $log.info("Admitted: " + $scope.cat.animalReceivedDate);
        $log.info("Altered: " + $scope.cat.animalAltered);
        $log.info("Where Altered: " + $scope.cat.whereAltered);
        $log.info("Microchip Vendor: " + $scope.cat.animalMicrochipVendor);
        $log.info("Microchip ID: " + $scope.cat.animalMicrochipNumber);
        $log.info("Declawed Front: " + $scope.cat.declawed);
        $scope.cat.vaccinations.forEach(function (vaccination) {
            $log.info(vaccination.name + ": " + vaccination.date);
        });
        $log.info("Notes: " + $scope.cat.animalNotes);

        $log.info("Cat: " + JSON.stringify($scope.cat));

        var promise = catServicesHolder.addEditCatService.addEditCat(catServicesHolder.catState.getState().token,
            catServicesHolder.catState.getState().tokenHash, $scope.cat, isEdit);
        promise.then(function (ret) {
            /*
             ret.status==200
             ret.statusText=="OK"
             ret.data.status=="ok"
             ret.data.messages.recordMessages[0].status=="ok"
             ret.data.messages.recordMessages[0].ID: 7833263
             ret.data.messages.recordMessages[0].messageText should say "Successfully saved the record."
             */
            var success =
                (ret.status == 200 &&
                    ret.statusText == "OK" &&
                    ret.data.status == "ok" &&
                    ret.data.messages.recordMessages[0].status == "ok");
            if (success) {
                catServicesHolder.growl.addSuccessMessage("Successfully " + (isEdit ? "Edited" : "Added") + " " +
                    $scope.cat.animalName, {ttl:5000});
                $location.path("/");
            } else {
                catServicesHolder.growl.addErrorMessage("Error encountered: " +
                    JSON.stringify(ret.data.messages.recordMessages, null, " "));
            }
        });
        promise.error(function (msg) {
            catServicesHolder.growl.addErrorMessage(msg);
        });
    };

    $scope.validateCat = function () {
        // Remove empty vaccinations before saving. We add an empty one by default to prompt the user
        // See http://stackoverflow.com/questions/9882284/looping-through-array-and-removing-items-without-breaking-for-loop
        var numVaccinations = $scope.cat.vaccinations.length;
        while (numVaccinations > 0) {
            var index = numVaccinations - 1;
            if (!$scope.cat.vaccinations[index] ||
                (!$scope.cat.vaccinations[index].name && !$scope.cat.vaccinations[index].date)) {
                $scope.cat.vaccinations.splice(index, 1);
            }
            else {
//                $scope.cat.vaccinations[index].date=catUtils.getFormattedDate($scope.cat.vaccinations[index].date);
            }
            numVaccinations = numVaccinations - 1;
        }
        // TODO: should intake date be allowed in the past?
        // TODO: validate weight?
        // TODO: should intake sources come from intake wizard?
    };
    $scope.breeds = [];
    catServicesHolder.getBreedsService.getData().then(function (ret) {
        var defaultBreed = undefined;
        angular.forEach(ret.data.data, function (value, key) {
            $scope.breeds.push(value);
            if (value.breedName === $scope.cat.animalBreed) {
                $scope.selectedBreed = value;
            }
            else if (value.breedName === 'Domestic Short Hair') {
                defaultBreed = value;
            }
        });
        if (!$scope.selectedBreed) {
            $scope.selectedBreed = defaultBreed;
            $scope.cat.animalBreed = defaultBreed.breedName;
            $scope.cat.animalPrimaryBreedID = defaultBreed.breedID;
        }
    });
    $scope.catColors = [];
    $scope.selectedCatColor = undefined;
    catServicesHolder.getColorsService.getData().then(function (ret) {
        angular.forEach(ret.data.data, function (value, key) {
            if (value.species === 'Cat') {
                value.id = key;
                $scope.catColors.push(value);
                if (value.name === $scope.cat.animalColor) {
                    $scope.selectedCatColor = value;
                }
            }
        });
    });
    $scope.catNames = [];
    var getCatNamesServicePromise = catServicesHolder.getCatNamesService.getData();
    getCatNamesServicePromise.then(function (ret) {
        angular.forEach(ret.data.data, function (value, key) {
            $scope.catNames.push(value.animalName);
        })
    });
    getCatNamesServicePromise.error(function (msg) {
        catServicesHolder.growl.addErrorMessage("getCatNamesService: "+JSON.stringify(msg, null, " "));
    });
    $scope.microchipVendors = [];
    $scope.selectedMicrochipVendor = undefined;
    catServicesHolder.getMicrochipVendorsService.getData(catServicesHolder.catState).then(function (ret) {
        var defaultVendor = undefined;
        angular.forEach(ret.data.data, function (value, key) {
            $scope.microchipVendors.push(value);
            if (value.name === $scope.cat.animalMicrochipVendor) {
                $scope.selectedMicrochipVendor = value;
            } else if (value.name === 'HomeAgain') {
                defaultVendor = value;
            }
        });
        if (!$scope.selectedMicrochipVendor) {
            $scope.selectedMicrochipVendor = defaultVendor;
        }
    });
    $scope.statuses = [];
    catServicesHolder.getStatusesService.getData().then(function (ret) {
        var defaultStatus = undefined;
        angular.forEach(ret.data.data, function (value, key) {
            value.id = key;
            $scope.statuses.push(value);
            if (value.name === $scope.cat.animalStatus) {
                $scope.selectedStatus = value;
            } else if (value.name === 'Hold') {
                defaultStatus = value;
            }
        });
        if (!$scope.selectedStatus) {
            $scope.selectedStatus = defaultStatus;
            $scope.cat.animalStatus = defaultStatus.name;
            $scope.cat.animalStatusID = defaultStatus.id;
        }
    });
    $scope.nameAlerts = [];
    $scope.isCatNameTaken = function () {
        if (!$scope.cat.animalName) {
            return;
        }
        var taken = $filter('filter')($scope.catNames, $scope.cat.animalName);
        if (taken.length > 0 && taken[0].toUpperCase() === $scope.cat.animalName.toUpperCase()) {
            $scope.nameAlerts.push({type: 'danger', msg: 'Name is already given to an available cat'});
        } else {
            $scope.nameAlerts.splice(0, 1);
        }
    }
}
function loginController($state, $scope, growl, loginService, catState) {

    $scope.doLogin = function () {
        var promise = loginService.login($scope.username, $scope.password, "910");
        promise.then(function (ret) {
            if (ret.data.status == "error") {
                growl.addErrorMessage("Error logging in!");
            } else {
                growl.addSuccessMessage("Successfully logged in", {ttl:5000});
                catState.setState(ret.data.data.token, ret.data.data.tokenHash);
                $state.go("list");
            }
        });
        promise.error(function (msg) {
            growl.addErrorMessage(msg);
        });
    };
}
function listController($scope, catQueryResult) {
    $scope.cats = [];
    angular.forEach(catQueryResult.data.data, function (cat, key) {
        $scope.cats.push(cat);
    });
    $scope.catFilter = "";
    $scope.sort = {
        column: 'name',
        ascending: false
    };
    $scope.changeSorting = function (column) {
        var sort = $scope.sort;
        if (sort.column == column) {
            sort.ascending = !sort.ascending;
        } else {
            sort.column = column;
            sort.ascending = false;
        }
    };
    $scope.selectedCls = function (column) {
        return column == $scope.sort.column && 'sort-' + $scope.sort.ascending;
    };
    $scope.currentPage = 1;
    $scope.pageChanged = function () {
        console.log('Page changed to: ' + $scope.currentPage);
    };
}
