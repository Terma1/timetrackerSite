let filter;
let hideCompleted;
let allSubjects;
const defaultSortSwitch = 0;
let sortSwitch;
let addSubjectPopup = document.getElementById("add-subject-popup");
let deleteSubjectPopup = document.getElementById("delete-subject-popup");
let editSubjectPopup = document.getElementById("edit-subject-popup");

let addSubjectButton = document.getElementById("add-subject-button");
addSubjectButton.addEventListener("click", openAddSubjectPopup);

let addSubjectPopupCancelButton = document.getElementById("add-subject-popup-cancel-button");
addSubjectPopupCancelButton.addEventListener("click", closeAddSubjectPopup);

let addSubjectPopupForm = document.getElementById("add-subject-popup-form");
addSubjectPopupForm.addEventListener("submit", addSubject);

let addSubjectPopupFormInputSubjectName = document.getElementById("add-subject-popup-form-input-subject-name");
addSubjectPopupFormInputSubjectName.addEventListener("input", () => {
    let newSubjectName = addSubjectPopupFormInputSubjectName.value;
    if (checkIfSubjectExists(newSubjectName)) {
        addSubjectPopupFormInputSubjectName.setCustomValidity("Subject with this name already exists");
    } else {
        addSubjectPopupFormInputSubjectName.setCustomValidity("");
    }
})


functionsToCallOnDbInit.push(initPage);


function reloadSubjectsFromDb() {
    getSubjectsFromDb((subjects) => {
        allSubjects = subjects.map(s => new Subject(s));
        refreshSubjectListInHtml();
    });
}

function initPage() {
    document.getElementById("search-field").addEventListener('keyup', (event) => {
        filter = event.target.value;
        refreshSubjectListInHtml();
    });
    document.getElementById("hide-completed-checkbox").addEventListener('change', (event) => {
        hideCompleted = event.target.checked;
        refreshSubjectListInHtml();
    });
    document.getElementById("sort-dropdown-content").addEventListener("change", handleTimetrackSort);
    if (sessionStorage.getItem("mainSortSwitch")) {
        sortSwitch = sessionStorage.getItem("mainSortSwitch");
    } else {
        sortSwitch = defaultSortSwitch;
    }
    reloadSubjectsFromDb();
}

function checkIfSubjectExists(subjectName) {
    let flag = false;

    let transaction = db.transaction("Subjects", "readwrite");
    let objectStore = transaction.objectStore("Subjects");

    let getAllSubjectsRequest = objectStore.getAll();

    getAllSubjectsRequest.onsuccess = () => {
        let subjectArray = getAllSubjectsRequest.result;
        for (let sub of subjectArray) {
            if (sub.name === subjectName) {
                flag = true;
            }
        }
    };

    getAllSubjectsRequest.onerror = (error) => {
        console.log(error.message);
    };

    transaction.onerror = (error) => {
        console.log(error.message);
    };
    return flag;
}

function addSubject() {
    let formElements = addSubjectPopupForm.elements;
    let newSubject = new Subject(null, formElements["subject-name"].value, formElements["semester"].value, formElements["required-hours"].value);

    addToDb(newSubject, () => {
        addSubjectPopupForm.reset();
        reloadSubjectsFromDb();
    });
}

//takes a single subject object and adds it to the document
//argument element is used to specify the subject container in the subjects container, after which the new container should be added
//if null add on top of the subjects container
function addSubjectToDocument(subject) {

    let subjectContainer = document.createElement("div");
    subjectContainer.setAttribute("class", "global-list-element-container");
    subjectContainer.setAttribute("id", subject.identifier + "-container");

    const subjectNameButton = createSubjectNameButton(subject);

    let subjectOptionContainer = document.createElement("div");
    subjectOptionContainer.setAttribute("class", "global-list-element-option-container");

    let subjectEditButton = document.createElement("button");
    subjectEditButton.setAttribute("class", "global-buttons global-list-element-option-button")
    subjectEditButton.innerText = languagePack.get("edit")[language];
    subjectEditButton.setAttribute("data-key", subject.timestamp.toString());
    subjectEditButton.addEventListener("click", () => openEditSubjectPopup(subject));


    let subjectDeleteButton = document.createElement("button");
    subjectDeleteButton.setAttribute("class", "global-buttons global-list-element-option-button");
    subjectDeleteButton.setAttribute("data-key", subject.timestamp.toString());
    subjectDeleteButton.innerText = languagePack.get("delete")[language];
    subjectDeleteButton.addEventListener("click", () => openDeleteSubjectPopup(subject));

    subjectOptionContainer.append(subjectEditButton, subjectDeleteButton);
    subjectContainer.append(subjectNameButton, subjectOptionContainer);

    let subjectsContainer = document.getElementById("subjects-container");
    subjectsContainer.prepend(subjectContainer);

    console.log(subject.identifier + " added to html");
}

function createSubjectNameButton(subject) {
    let subjectNameButton = document.createElement("button");
    subjectNameButton.setAttribute("class", "global-buttons global-list-element-name-button");
    subjectNameButton.innerText = subject.name + (subject.isCompleted() ? ' ✅' : '');
    subjectNameButton.addEventListener("click", () => openSubjectPage(subject.timestamp));
    if (filter) {
        subjectNameButton.innerHTML = subjectNameButton.innerHTML.replaceAll(filter, `<t>${filter}</t>`);
    }
    return subjectNameButton;
}

function openSubjectPage(timestamp) {
    sessionStorage.setItem("currentSubjectIdentifier", JSON.stringify(timestamp));
    window.location.href = "subject.html";
}

function editSubject(subject) {
    let editSubjectPopupForm = document.getElementById("edit-subject-popup-form");
    let formElements = document.getElementById("edit-subject-popup-form").elements;
    let newSubject = new Subject(null, formElements["subject-name"].value, formElements["semester"].value, formElements["required-hours"].value);
    newSubject.timestamp = subject.timestamp;
    newSubject.timetracks = subject.timetracks;

    if (!newSubject.compareNameSemesterHours(subject)) {
        //if something was changed

        let transaction = db.transaction("Subjects", "readwrite");
        let objectStore = transaction.objectStore("Subjects");

        let updateSubjectRequest = objectStore.put(newSubject);

        updateSubjectRequest.onsuccess = () => {
            console.log("Subject " + subject.name + " changed to " + newSubject.name);

            editSubjectPopupForm.reset();
            closeEditSubjectPopup();
        }

        updateSubjectRequest.onerror = (error) => {
            console.log(error.message);
        };

        transaction.oncomplete = () => {
            reloadSubjectsFromDb();
        }

        transaction.onerror = (error) => {
            console.log(error.message);
        };
    }
    closeEditSubjectPopup();
}

//takes a subject, deletes it from local storage and from the document and closes the delete subject popup
function deleteSubject(subject) {
    let transaction = db.transaction("Subjects", "readwrite");
    let objectStore = transaction.objectStore("Subjects");

    let key = subject.timestamp;

    let objectDeleteRequest = objectStore.delete(key);

    objectDeleteRequest.onsuccess = () => {
        //buttonClickEvent.target.parentNode.parentNode.removeChild(buttonClickEvent.target.parentNode); //remove from list
        console.log("Subject " + subject.name + " successfully deleted from the Database");
        reloadSubjectsFromDb();
    };

    objectDeleteRequest.onerror = (error) => {
        console.log(error.message);
    };

    transaction.oncomplete = () => {
        closeDeleteSubjectPopup();
    };

    transaction.onerror = (error) => {
        console.log(error.message);
    };
}

function openAddSubjectPopup() {
    addSubjectPopup.showModal();
}

function openDeleteSubjectPopup(subject) {
    deleteSubjectPopup.showModal();

    let deleteSubjectPopupSubjectNameContainer = document.getElementById("delete-subject-popup-subject-name-container");
    deleteSubjectPopupSubjectNameContainer.innerHTML = (subject.name + " (" + subject.semester + ")");

    let deleteSubjectPopupCancelButton = document.getElementById("delete-subject-popup-cancel-button");
    deleteSubjectPopupCancelButton.addEventListener("click", closeDeleteSubjectPopup);

    //in order to delete all the previously associated event listeners, we clone the button and then add
    //a new one on its place, which doesn't have any event listeners

    let deleteSubjectPopupConfirmButton = document.getElementById("delete-subject-popup-form-confirm-button");
    let newDeleteSubjectPopupConfirmButton = deleteSubjectPopupConfirmButton.cloneNode(true);
    deleteSubjectPopupConfirmButton.parentNode.replaceChild(newDeleteSubjectPopupConfirmButton, deleteSubjectPopupConfirmButton);
    newDeleteSubjectPopupConfirmButton.addEventListener("click", () => deleteSubject(subject), {once: true});
}

function openEditSubjectPopup(subject) {
    editSubjectPopup.showModal();

    //show subject info in form
    let formInputSubjectName = document.getElementById("edit-subject-popup-form-input-subject-name");
    let formInputSubjectSemester = document.getElementById("edit-subject-popup-form-input-semester");
    let formInputSubjectHours = document.getElementById("edit-subject-popup-form-input-required-hours");

    formInputSubjectName.value = subject.name;
    formInputSubjectSemester.value = subject.semester;
    formInputSubjectHours.value = subject.expectedHours;


    let editSubjectPopupConfirmButton = document.getElementById("edit-subject-popup-form-confirm-button");
    let newEditSubjectPopupConfirmButton = editSubjectPopupConfirmButton.cloneNode(true);
    editSubjectPopupConfirmButton.parentNode.replaceChild(newEditSubjectPopupConfirmButton, editSubjectPopupConfirmButton);
    newEditSubjectPopupConfirmButton.addEventListener("click", () => editSubject(subject), {once: true});
    //}


    let editSubjectPopupCancelButton = document.getElementById("edit-subject-popup-form-cancel-button");
    editSubjectPopupCancelButton.addEventListener("click", closeEditSubjectPopup);

}


function closeAddSubjectPopup() {
    addSubjectPopup.close();
    addSubjectPopupForm.reset();
}

function closeDeleteSubjectPopup() {
    deleteSubjectPopup.close();
}

function closeEditSubjectPopup() {
    editSubjectPopup.close();
}


function refreshSubjectListInHtml() {
    let subjectsContainer = document.getElementById("subjects-container");
    //remove all contents
    subjectsContainer.innerHTML = "";
    switch (sortSwitch) {
        // alphabetically asc
        case 0:
            allSubjects.sort((timetrack1, timetrack2) => timetrack1.timestamp - timetrack2.timestamp);
            break;
        // study duration desc
        case 1:
            allSubjects.sort((timetrack1, timetrack2) => timetrack2.timestamp - timetrack1.timestamp);
            break;
        case 2:
            allSubjects.sort((s1, s2) => s1.name.localeCompare(s2.name, 'en', {sensitivity: 'base'}));
            break;
        // alphabetically desc
        case 3:
            allSubjects.sort((s1, s2) => s2.name.localeCompare(s1.name, 'en', {sensitivity: 'base'}));
            break;


    }
    document.getElementById("search-field").setAttribute("placeholder", languagePack.get("search placeholder")[language]);
    //add  subject button
    let button = document.createElement("button");
    button.setAttribute("class", "global-buttons global-add-button");
    button.setAttribute("id", "add-subject-button");
    button.innerText = "+";
    button.addEventListener("click", openAddSubjectPopup);
    let container = document.createElement("div");
    container.setAttribute("class", "global-list-element-container");
    container.append(button);
    subjectsContainer.append(container);

    for (let i = 0; i < subjectsContainer.children.length - 1; i++) {
        subjectsContainer.children[i].remove();
    }

    for (const subject of allSubjects) {

        const shouldInclude = !filter || createSubjectNameButton(subject).innerText.indexOf(filter) >= 0;

        if ((!hideCompleted || !subject.isCompleted()) && shouldInclude) {
            addSubjectToDocument(subject);
        }
    }
    setTranslations();
}

// sort
function handleTimetrackSort() {
    const selectedSortType = document.getElementById("sort-dropdown-content");
    switch (selectedSortType.value) {
        case "date-of-creation-desc":
            setSortSwitch(0);
            break;
        case "date-of-creation-asc":
            setSortSwitch(1);
            break;
        case "alphabetically-desc":
            setSortSwitch(2);
            break;
        case "alphabetically-asc":
            setSortSwitch(3);


    }
}

function setSortSwitch(index) {
    sortSwitch = index;
    sessionStorage.setItem("mainSortSwitch", JSON.stringify(sortSwitch));
    refreshSubjectListInHtml();
}

