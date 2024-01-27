(() => {

    let currentSubject;
    let idToRemove;
    let sortSwitch;
    let filter;
    let hideWithBreak = false;
    const defaultSortSwitch = 4;

// displaying timetracks


    function refreshTimetracksInHtml() {
        console.log(currentSubject.name + " selected");
        idToRemove = "";
        let timeTracksContainer = document.getElementById("timetracks-container");
        timeTracksContainer.innerText = ``;
        displayProgress();

        refreshNumberOfTimetracks();

        const filteredTimetracks = currentSubject.timetracks.filter((timetrack) => {
            if (hideWithBreak && timetrack.pauseDuration > 0) {
                return false;
            }
            if (!filter) {
                return true;
            }
            return createTimetrackNameButton(timetrack).innerText.indexOf(filter) >= 0;
        });

        switch (sortSwitch) {
            // start date asc
            case 0:
                filteredTimetracks.sort((timetrack1, timetrack2) => timetrack1.startDate - timetrack2.startDate);
                break;

            case 1:
                filteredTimetracks.sort((timetrack1, timetrack2) => timetrack2.startDate - timetrack1.startDate);
                break;
            // study duration asc
            case 2:
                filteredTimetracks.sort((timetrack1, timetrack2) => timetrack2.getStudyDuration() - timetrack1.getStudyDuration());
                break;
            // study duration desc
            case 3:
                filteredTimetracks.sort((timetrack1, timetrack2) => timetrack1.getStudyDuration() - timetrack2.getStudyDuration());
                break;
            // start date asc
            // pause duration asc
            case 4:
                filteredTimetracks.sort((timetrack1, timetrack2) => timetrack2.pauseDuration - timetrack1.pauseDuration);
                break;
            // pause duration desc
            case 5:
                filteredTimetracks.sort((timetrack1, timetrack2) => timetrack1.pauseDuration - timetrack2.pauseDuration);


        }

        if (filteredTimetracks != null) {
            if (filteredTimetracks.length === 0) {
                const timetrackPlaceHolder = document.createElement("timetrack-placeholder");
                timetrackPlaceHolder.classList.add("placeholder");
                timetrackPlaceHolder.innerText = languagePack.get("timetrackPlaceholder")[language];
                timeTracksContainer.append(timetrackPlaceHolder);
            } else {
                for (const timetrack of filteredTimetracks) {
                    const div = document.createElement("div");
                    const timetrackNameButton = createTimetrackNameButton(timetrack);
                    const timetrackEditButton = createTimetrackEditButton(timetrack);
                    const timetrackDeleteButton = createTimetrackDeleteButton(timetrack.id);
                    const optionDiv = document.createElement("div");
                    optionDiv.classList.add("global-list-element-option-container");
                    div.classList.add("global-list-element-container");
                    optionDiv.append(timetrackEditButton, timetrackDeleteButton)
                    div.append(timetrackNameButton, optionDiv);
                    timeTracksContainer.append(div);
                }
            }
        }

        const addButton = document.createElement("button");
        addButton.innerText = "+";
        addButton.classList.add("global-buttons");
        addButton.classList.add("global-add-button");
        addButton.setAttribute("id", "add-timetrack-button");
        timeTracksContainer.append(addButton);
        document.getElementById("search-field").setAttribute("placeholder", languagePack.get("search placeholder")[language]);
        addTimeTrackButton();
        setTranslations();
    }

    function setSortSwitch(index) {
        sortSwitch = index;
        sessionStorage.setItem("subjectSortSwitch", JSON.stringify(sortSwitch));
        refreshTimetracksInHtml();
    }


    function createTimetrackNameButton(timeTrack) {
        const startDate = new Date(timeTrack.startDate);
        const endDate = new Date(timeTrack.endDate);
        let timeDifference = calculateTimeDifference(startDate, endDate, timeTrack.pauseDuration);
        let studyDuration;

        if (timeDifference.hours !== 0) {
            studyDuration = `${timeDifference.hours} ${languagePack.get("hours")[language]} ${timeDifference.minutes} ${languagePack.get("minutes")[language]} `;
        } else {
            studyDuration = `${languagePack.get("minutes")[language]}: ${timeDifference.minutes} `;
        }

        const pauseMinutes = minutesToHoursAndMinutes(timeTrack)[1];
        const pauseHours = minutesToHoursAndMinutes(timeTrack)[0];
        let breakDurationHours;
        if (pauseHours <= 0) {
            breakDurationHours = `${languagePack.get("break duration")[language]} ${pauseMinutes} ${languagePack.get("minutes")[language]}`
        } else {
            breakDurationHours = `${languagePack.get("break duration")[language]} ${pauseHours} ${languagePack.get("hours")[language]} ${pauseMinutes} ${languagePack.get("minutes")[language]} `
        }


        const timetrackNameButton = document.createElement("button");
        const formattedDate = startDate.toLocaleString(languagePack.get("locale")[language], {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        });
        timetrackNameButton.innerText = `${formattedDate}.\n${languagePack.get("study duration")[language]}: ${studyDuration}.\n${breakDurationHours}`;
        timetrackNameButton.setAttribute("id", "timetrack-name-button");
        timetrackNameButton.classList.add("global-list-element-name-button", "global-buttons");
        if (filter) {
            timetrackNameButton.innerHTML = timetrackNameButton.innerHTML.replaceAll(filter, `<t>${filter}</t>`);
        }
        return timetrackNameButton;
    }

    function createTimetrackDeleteButton(id) {
        const timetrackDeleteButton = document.createElement("button");
        timetrackDeleteButton.classList.add("global-list-element-option-button", "global-buttons");
        timetrackDeleteButton.innerText = languagePack.get("delete")[language];
        timetrackDeleteButton.addEventListener("click", () => {
            deleteTimetrackPopup.showModal();
            idToRemove = id;
        });
        return timetrackDeleteButton;
    }

    function createTimetrackEditButton(timetrack) {
        const timetrackEditButton = document.createElement("button");
        timetrackEditButton.classList.add("global-list-element-option-button", "global-buttons");
        timetrackEditButton.innerText = languagePack.get("edit")[language];
        timetrackEditButton.addEventListener("click", () => {
            editTimeTrackPopup.showModal();
            const startDateInput = document.getElementById("start-date-edit-popup");
            startDateInput.value = convertToDateTimeLocalString(timetrack.startDate);
            const endDateInput = document.getElementById("end-date-edit-popup");
            endDateInput.value = convertToDateTimeLocalString(timetrack.endDate);

            const pauseDurationHours = document.getElementById("break-duration-hours-edit-popup");
            pauseDurationHours.value = minutesToHoursAndMinutes(timetrack)[0];
            const pauseDurationMinutes = document.getElementById("break-duration-minutes-edit-popup");
            pauseDurationMinutes.value = minutesToHoursAndMinutes(timetrack)[1];
            idToRemove = timetrack.id;
        });
        return timetrackEditButton;

    }

    function convertToDateTimeLocalString(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    function calculateTimeDifference(startDate, endDate, pause) {
        const timeDifference = endDate - startDate - pause * 60 * 1000;
        let hours = Math.floor(timeDifference / (60 * 60 * 1000));
        let minutes = Math.floor((timeDifference % (60 * 60 * 1000)) / (60 * 1000));
        if ((hours <= 0) && (minutes <= 0)) {
            hours = 0;
            minutes = 0;
        }
        return {hours, minutes};
    }

    // Add-Popup
    const addTimetrackPopup = document.getElementById("add-timetrack-popup");
    // applyDateChecker("start-date-add-popup", "end-date-add-popup");
    const addTimetrackPopupForm = document.getElementById("add-timetrack-popup-form");
    const closeTimetrackAddPopupButton = document.getElementById("close-add-timetrack-popup-button");
    closeTimetrackAddPopupButton.addEventListener("click", () => addTimetrackPopup.close());
    applyPauseDurationChecker("break-duration-hours-add-popup", "break-duration-minutes-add-popup", "start-date-add-popup", "end-date-add-popup");
    addTimetrackPopupForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const startDateInput = document.getElementById("start-date-add-popup");
        const endDateInput = document.getElementById("end-date-add-popup");
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        const pauseDurationHours = parseInt(document.getElementById("break-duration-hours-add-popup").value, 10) || 0;
        const pauseDurationMinutes = parseInt(document.getElementById("break-duration-minutes-add-popup").value, 10) || 0;
        const pauseDurationTotal = (pauseDurationMinutes + (pauseDurationHours * 60));

        if (addTimetrackPopupForm.checkValidity()) {
            const timetrack = new Timetrack(null, startDate, endDate, currentSubject.timetracks, pauseDurationTotal);
            currentSubject.addTimetrack(timetrack);
            updateSubject(currentSubject);
            addTimetrackPopupForm.reset();
            addTimetrackPopup.close();
        }
        refreshTimetracksInHtml();
    });


    function addTimeTrackButton() {
        const addTimetrackButton = document.getElementById("add-timetrack-button");
        addTimetrackButton.addEventListener("click", () => addTimetrackPopup.showModal());

    }


    // delete popup
    const deleteTimetrackPopup = document.getElementById("delete-timetrack-popup");


    let deleteSubjectPopupCancelButton = document.getElementById("delete-timetrack-popup-cancel-button");
    deleteSubjectPopupCancelButton.addEventListener("click", () => {
        deleteTimetrackPopup.close();
        idToRemove = "";
    });
    let deleteSubjectPopupConfirmButton = document.getElementById("delete-timetrack-popup-form-confirm-button");
    deleteSubjectPopupConfirmButton.addEventListener("click", () => {
        currentSubject.deleteTimetrack(idToRemove);
        updateSubject(currentSubject);
        refreshTimetracksInHtml();
        deleteTimetrackPopup.close();
    });


    //edit popup
    const editTimeTrackPopup = document.getElementById("edit-timetrack-popup");
    const editTimetrackPopupForm = document.getElementById("edit-timetrack-popup-form");
    const closeTimetrackEditPopupButton = document.getElementById("close-edit-timetrack-popup-button");
    closeTimetrackEditPopupButton.addEventListener("click", () => editTimeTrackPopup.close());
    applyPauseDurationChecker("break-duration-hours-edit-popup", "break-duration-minutes-edit-popup", "start-date-edit-popup", "end-date-edit-popup");
    editTimetrackPopupForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const startDateInput = document.getElementById("start-date-edit-popup");
        const endDateInput = document.getElementById("end-date-edit-popup");
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        const pauseDurationHours = parseInt(document.getElementById("break-duration-hours-edit-popup").value, 10);
        const pauseDurationMinutes = parseInt(document.getElementById("break-duration-minutes-edit-popup").value, 10);
        const pauseDurationTotal = (pauseDurationMinutes + (pauseDurationHours * 60));

        if (editTimetrackPopupForm.checkValidity()) {
            const timetrack = new Timetrack(null, startDate, endDate, currentSubject.timetracks, pauseDurationTotal);
            currentSubject.addTimetrack(timetrack);
            currentSubject.deleteTimetrack(idToRemove);
            updateSubject(currentSubject);
            editTimeTrackPopup.close();
        }
        refreshTimetracksInHtml();
    });


    functionsToCallOnDbInit.push(initPage);

    function handleTimetrackSort() {
        const selectedSortType = document.getElementById("sort-dropdown-content");
        switch (selectedSortType.value) {
            case "start-date-desc":
                setSortSwitch(0);
                break;
            case "start-date-asc":
                setSortSwitch(1);
                break;
            case "study-duration-desc":
                setSortSwitch(2);
                break;
            case "study-duration-asc":
                setSortSwitch(3);
                break;
            case "pause-duration-desc":
                setSortSwitch(4);
                break;
            case "pause-duration-asc":
                setSortSwitch(5);


        }
    }

    function refreshNumberOfTimetracks() {
        const numberOfTimetracks = document.getElementById("number-of-timetracks");
        numberOfTimetracks.innerText = languagePack.get("number of timetracks")[language] + ": " + currentSubject.timetracks.length;
    }


    function pauseDurationChecker(hours, minutes, startDate, endDate) {
        if (startDate.value > endDate.value) {
            endDate.setCustomValidity(languagePack.get("time cannot run back")[language]);
            startDate.setCustomValidity(languagePack.get("time cannot run back")[language]);
        } else if (startDate.value === endDate.value) {
            endDate.setCustomValidity(languagePack.get("start equals to the end")[language]);
            startDate.setCustomValidity(languagePack.get("start equals to the end")[language]);
        } else {
            endDate.setCustomValidity("");
            startDate.setCustomValidity("");
        }
        if (parseInt(hours.value) * 60 + parseInt(minutes.value || "0") >= (new Date(endDate.value) - new Date(startDate.value)) / 60000) {
            minutes.setCustomValidity(languagePack.get("break larger study")[language]);
            hours.setCustomValidity(languagePack.get("break larger study")[language]);
        } else {
            minutes.setCustomValidity("");
            hours.setCustomValidity("");
        }
    }


    function applyPauseDurationChecker(hoursElement, minutesElement, startDateElement, endDateElement) {
        const startDate = document.getElementById(startDateElement);
        const endDate = document.getElementById(endDateElement);
        const hours = document.getElementById(hoursElement);
        const minutes = document.getElementById(minutesElement);
        hours.addEventListener("input", () => pauseDurationChecker(hours, minutes, startDate, endDate));
        minutes.addEventListener("input", () => pauseDurationChecker(hours, minutes, startDate, endDate));
        startDate.addEventListener("input", () => pauseDurationChecker(hours, minutes, startDate, endDate));
        endDate.addEventListener("input", () => pauseDurationChecker(hours, minutes, startDate, endDate));
    }

    function minutesToHoursAndMinutes(timetrack) {
        const pauseDuration = timetrack.pauseDuration;
        const hours = Math.floor(pauseDuration / 60);
        const minutes = pauseDuration % 60;
        return [hours, minutes];
    }

    function displayProgress() {
        let progressPercent;
        if (currentSubject.expectedHours === "0") {
            progressPercent = 100;
        } else {
            progressPercent = parseFloat((currentSubject.timetracks.map(t => t.getStudyDuration()).reduce((summ, curr) => summ + curr, 0) * 100 / (currentSubject.expectedHours * 60)).toFixed(2));
        }
        let progressIndicator = document.getElementById("progression-subject");
        progressIndicator.innerText = `${languagePack.get("progress")[language]}: ${progressPercent}% ${languagePack.get("of the planned")[language]} ${currentSubject.expectedHours} ${languagePack.get("hours")[language]}`;
    }

    function initPage() {
        const currentSubjectIdentifier = JSON.parse(sessionStorage.getItem("currentSubjectIdentifier"))
        document.getElementById("sort-dropdown-content").addEventListener("change", handleTimetrackSort);
        document.getElementById("search-field").addEventListener('keyup', (event) => {
            filter = event.target.value;
            refreshTimetracksInHtml();
        });

        document.getElementById("hideWithBreakCheckbox").addEventListener('change', (event) => {
            hideWithBreak = event.target.checked;
            refreshTimetracksInHtml();
        });

        if (sessionStorage.getItem("subjectSortSwitch")) {
            sortSwitch = sessionStorage.getItem("subjectSortSwitch");
        } else {
            sortSwitch = defaultSortSwitch;
        }
        getSubjectsFromDb((data) => {
            currentSubject = new Subject(data);
            if (currentSubject) {
                console.log("Found subject:", currentSubject);
            } else {
                console.log("Subject not found");
            }
            refreshTimetracksInHtml();
            const subjectName = document.getElementById("subject-name");
            subjectName.innerText = languagePack.get("subject")[language] + ": " + currentSubject.name;
            const semester = document.getElementById("semester-number");
            semester.innerText = languagePack.get("semester")[language] + ": " + currentSubject.semester;


        }, null, currentSubjectIdentifier);

    }


})();