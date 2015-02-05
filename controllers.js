'use strict';

function medicalIntakeController($scope, $log, $filter, $state, catServicesHolder) {
    $scope.cat = {
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
        animalNotes: "",
        // Items stored in our private, encoded field (origin notes)
        version: "1.0.0",
        age: "",
        weight: "",
        source: "",
        admitted: "",
        whereAltered: "",
        declawed: {front: false, back: false},
        felvTest: {result: "", date: "", alerts: []},
        fivTest: {result: "", date: "", alerts: []},
        vaccinations: [
            {name: "", date: "", alerts: []}
        ]
    };
    initAddEdit($scope, $log, $filter, $state, catServicesHolder, false);
}
function editIntakeController($scope, $log, $filter, $state, catServicesHolder, catQueryResult, decodeCatService) {
    $scope.cat = {};
    angular.forEach(catQueryResult.data.data, function (cat, key) {
        $scope.cat = cat;
    });
    decodeCatService.execute($scope.cat);
    // Do some transformations
    $scope.cat.animalReceivedDate = new Date($scope.cat.animalReceivedDate);
    $scope.cat.animalBirthdate = new Date($scope.cat.animalBirthdate);
    initAddEdit($scope, $log, $filter, $state, catServicesHolder, true);
}
function initAddEdit($scope, $log, $filter, $state, catServicesHolder, isEdit) {
    $scope.dobAlerts = [];
    $scope.admittedAlerts = [];
    $scope.isSaving = false;

    $scope.validateFutureDate = function (alerts, dateToCheck) {
        var today = new Date();
        if (dateToCheck > today) {
            var futureAlerts = $filter('filter')(alerts, 'Date cannot be in the future');
            if (futureAlerts.length < 1) {
                alerts.push({type: 'danger', msg: 'Date cannot be in the future'});
            }
        } else {
            alerts.splice(0, 1);
        }
        return today;
    };

    $scope.setAge = function () {
        $scope.validateFutureDate($scope.dobAlerts, $scope.cat.animalBirthdate);
        $scope.validateFutureDate($scope.admittedAlerts, $scope.cat.animalReceivedDate);
        var dobLaterThanIntakeAlerts = $filter('filter')($scope.admittedAlerts,
            'Intake Date cannot be earlier than Estimated Date of Birth');
        if ($scope.cat.animalReceivedDate < $scope.cat.animalBirthdate) {
            if (dobLaterThanIntakeAlerts.length < 1) {
                $scope.admittedAlerts.push({type: 'danger', msg: 'Intake Date cannot be earlier than Estimated Date of Birth'});
            }
        } else {
            if (dobLaterThanIntakeAlerts.length > 0) {
                $scope.admittedAlerts.splice(0, 1);
            }
        }
        $scope.cat.age =
            catServicesHolder.catUtils.ageFromDate($scope.cat.animalBirthdate, $scope.cat.animalReceivedDate,
                $scope.cat.age);
    };
    $scope.cat.age = $scope.cat.animalBirthdate ?
        catServicesHolder.catUtils.ageFromDate($scope.cat.animalBirthdate, $scope.cat.animalReceivedDate,
            $scope.cat.age) : "";

    $scope.addVaccination = function () {
        $scope.cat.vaccinations.push({name: "", date: "", alerts: []});
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
    $scope.validateVaccinationDate = function (vaccinationIndex) {
        $scope.validateFutureDate($scope.cat.vaccinations[vaccinationIndex].alerts,
            $scope.cat.vaccinations[vaccinationIndex].date);
    };
    $scope.saveCat = function (isValid, nextState) {
        if (!isValid) {
            // The user should never see this, it's a fail-safe.
            alert("There is an error on the form. Please check the information entered.");
            return;
        }
        // Disable Save buttons to avoid double submits
        $scope.isSaving = true;
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
                    $scope.cat.animalName, {ttl: 5000});
                $state.go(nextState);
            } else {
                catServicesHolder.growl.addErrorMessage("Error encountered: " +
                    JSON.stringify(ret.data.messages.recordMessages, null, " "));
            }
            $scope.isSaving = false;
        });
        promise.error(function (msg) {
            catServicesHolder.growl.addErrorMessage(msg || "Error " + (isEdit ? "Editing" : "Adding") + " cat");
            $scope.isSaving = false;
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
        catServicesHolder.growl.addErrorMessage("getCatNamesService: " + JSON.stringify(msg, null, " "));
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
        var takenAlerts = $filter('filter')($scope.nameAlerts, 'Name is already taken');
        if (taken.length > 0 && taken[0].toUpperCase() === $scope.cat.animalName.toUpperCase()) {
            if (takenAlerts.length < 1) {
                $scope.nameAlerts.push({type: 'danger', msg: 'Name is already taken'});
            }
        } else {
            if (takenAlerts.length > 0) {
                $scope.nameAlerts.splice(0, 1);
            }
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
                growl.addSuccessMessage("Successfully logged in", {ttl: 5000});
                catState.setState(ret.data.data.token, ret.data.data.tokenHash);
                $state.go("list");
            }
        });
        promise.error(function (msg) {
            growl.addErrorMessage(msg || "Error logging in");
        });
    };
}

function listController($scope, $state, growl, catState, getAllCats, findCatByName, findCatByTypeahead,
                        decodeCatService) {
    $scope.sortColumn = 'animalName';
    $scope.sortReverse = false;
    $scope.cats = [];
    $scope.showSpinner = true;
    $scope.status = catState.getState().status;
    $scope.queryCats = function () {
        $scope.cats = [];
        $scope.showSpinner = true;
        var promise = getAllCats.getData($scope.status);
        promise.then(function (ret) {
            angular.forEach(ret.data.data, function (cat, key) {
                $scope.cats.push(cat);
                decodeCatService.execute(cat);
            });
            $scope.showSpinner = false;
            if ($scope.cats.length < 1) {
                growl.addInfoMessage("No results returned")
            }
        });
        promise.error(function (msg) {
            growl.addErrorMessage(msg || "Error retrieving cats");
        });
    };
    $scope.$watch('status', function () {
        catState.setStatus($scope.status);
        $scope.queryCats();
    }, true);
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
    $scope.catSearchCriterion = "";
    $scope.findCatByTypeahead = function (searchStr) {
        return findCatByTypeahead.getData(searchStr).
            then(function (ret) {
                var result = ret.data.data;
                var uniqueCatsFound = {};
                angular.forEach(result, function (value, key) {
                    if (!(value.animalName in uniqueCatsFound)) {
                        uniqueCatsFound[value.animalName] = true;
                    }
                });
                var catsFound = [];
                angular.forEach(uniqueCatsFound, function (value, key) {
                    catsFound.push(key);
                });
                return catsFound;
            });
    };
    $scope.findCatByName = function () {
        var promise = findCatByName.getData($scope.catName);
        promise.then(function (ret) {
            var result = ret.data.data;
            var resultLength = Object.keys(result).length;
            if (resultLength < 1) {
                growl.addErrorMessage("No cat found by that name");
                return;
            }
            if (resultLength > 1) {
                catState.getState().foundCats = result;
                $state.go("findCat");
                return;
            }
            angular.forEach(result, function (value, key) {
                $state.go("editCat", {catId: key});
            });
        });
        promise.error(function (msg) {
            growl.addErrorMessage(msg || "Error encountered retrieving cat by name");
        });
    };
    $scope.loggedIn = catState.getState().token || catState.getState().tokenHash;
}
function findCatController($scope, $state, growl, catState, getAllCats, findCatByName) {
    $scope.cats = [];
    angular.forEach(catState.getState().foundCats, function (cat, key) {
        $scope.cats.push(cat);
    });
}
