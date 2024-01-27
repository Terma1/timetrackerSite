const versionNumber = "1.0";

function loadServiceWorker() {
    if (!navigator.serviceWorker.controller) {
        navigator.serviceWorker.register("../serviceWorker.js").then(function (reg) {
            console.log("Service worker has been registered for scope: " + reg.scope);
        });
    }
}

function goToMain() {
    window.location.href = 'main.html';
}

function goToStatistic() {
    window.location.href = 'statistic.html';
}

function goToSettings() {
    window.location.href = 'settings.html';
}

class Subject {
    constructor(object, name, semester, expectedHours) {
        if (object) {
            for (const key of Object.keys(object)) {
                this[key] = object[key];
                if (key === "timetracks") {
                    let i = 0;
                    for (const timetrack of object[key]) {
                        this[key][i] = new Timetrack(timetrack);
                        i++;
                    }
                }
            }
            return;
        }
        this.name = name;
        this.semester = semester;
        this.timetracks = [];
        this.actualMinutes = 0;
        this.expectedHours = expectedHours;
        this.identifier = name.replace(/\W+/g, '-').toLowerCase() + "-" + semester.replace(/\W+/g, '-').toLowerCase();
        this.timestamp = Date.now();
        this.lastEdited = Date.now();
    }


    addTimetrack(timetrack) {
        if (timetrack) {
            let timeDifference = (timetrack.endDate - timetrack.startDate) / 60000 - timetrack.pauseDuration;
            if (timeDifference < 0) {
                timeDifference = 0;
            }
            this.actualMinutes += timeDifference;


            this.timetracks.push(timetrack);
            console.log("actual minutes: " + this.actualMinutes);
        }
    };

    isCompleted() {
        return this.timetracks.map(t => t.getStudyDuration()).reduce((t1, t2) => t1 + t2, 0) > this.expectedHours * 60;
    }


    deleteTimetrack(id) {
        if (id) {
            const indexToRemove = this.timetracks.findIndex(t => t.id === id);
            if (indexToRemove !== -1) {
                const timetrack = this.timetracks[indexToRemove];
                let timeDifference = timetrack.endDate - timetrack.startDate - timetrack.pauseDuration;
                if (timeDifference < 0) {
                    timeDifference = 0;
                }
                this.actualMinutes -= Math.floor(timeDifference / (60 * 1000));
                console.log("actual minutes: " + this.actualMinutes);
                this.timetracks.splice(indexToRemove, 1);

            }
        }
    }

    compareNameSemesterHours(subject) {
        return this.name === subject.name && this.semester === subject.semester && this.expectedHours === subject.expectedHours;
    }

}


function generateAuthenticationHeader(username, password) {
    return "Basic " + btoa(username + ":" + password);
}

class Backup {
    constructor(object) {
        if (object) {
            for (const key of Object.keys(object)) {
                this[key] = object[key];
                if (key === "subjects") {
                    let i = 0;
                    for (const subject of object[key]) {
                        this[key][i] = new Subject(subject);
                        i++;
                    }
                }

            }
            return;
        }
        this.time = getCurrentTimeAsString();
        this.subjects = [];
    }

    addSubjectToDatabase(subject) {
        if (subject) {
            this.subjects.push(subject);
        }
    }
}

function getCurrentTimeAsString() {
    let result;
    let date = new Date();

    let yyyy = date.getFullYear();
    let mm = date.getMonth() + 1; //January is 0.
    let dd = date.getDate();
    let h = date.getHours();
    let m = date.getMinutes();
    let s = date.getSeconds();

    let del = "-";

    if (mm < 10)
        mm = "0" + mm;
    if (dd < 10)
        dd = "0" + dd;
    if (h < 10)
        h = "0" + h;
    if (m < 10)
        m = "0" + m;
    if (s < 10)
        s = "0" + s;

    result = yyyy + del + mm + del + dd + del + h + del + m + del + s;
    console.log(result);
    return result;
}

function replaceIndexedDBWithBackup(backup) {
    //delete everything in IndexedDB

    let transaction = db.transaction("Subjects", "readwrite");
    let objectStore = transaction.objectStore("Subjects");
    let clearRequest = objectStore.clear();

    clearRequest.onsuccess = () => {
        console.log("All data in IndexedDB deleted");
    }

    clearRequest.onerror = (error) => {
        console.log(error);
    }

    transaction.oncomplete = () => {
        //add Backup to IndexedDB
        for (let subject of backup.subjects) {
            addToDb(subject,
                () => {
                    console.log(subject.name + "added to db");
                },
                () => {
                    alert(languagePack.get("error when adding backup to db")[language]);

                })
        }
        alert(languagePack.get("db updated")[language]);
    }

    transaction.onerror = clearRequest.onerror;
}

class Timetrack {

    constructor(object, startDate, endDate, timetracks, pauseDuration) {
        if (object) {
            for (const key of Object.keys(object)) {
                this[key] = object[key];
                if (key === "startDate" || key === "endDate") {
                    this[key] = new Date(object[key]);
                }
            }
            return;
        }
        this.startDate = startDate;
        this.endDate = endDate;
        this.pauseDuration = pauseDuration;
        this.id = this.getNextId(timetracks);
    }

    getNextId(timetracks) {
        if (!timetracks.length) {
            return 1;
        }
        return timetracks.map(timetrack => timetrack.id).sort((timetrack1, timetrack2) => timetrack2 - timetrack1)[0] + 1;

    }

    getStudyDuration() {
        return (this.endDate - this.startDate) / 60000 - this.pauseDuration;
    }


}


let db; //to store IndexedDB data
const functionsToCallOnDbInit = [];
const DBOpenRequest = window.indexedDB.open("SubjectsDB"); //open an IndexedDB


DBOpenRequest.onerror = () => {
    if (!window.indexedDB) {
        window.alert("Your browser doesn't support IndexedDB. In order to use this application please update your browser.");
    } else {
        window.alert("Connection to IndexedDB failed");
    }
}


//initialize object stores
// the function is being called when opening the db for the first time or
DBOpenRequest.onupgradeneeded = (event) => {
    db = event.target.result;
    let objectStore = db.createObjectStore("Subjects", {
        autoIncrement: true,
        keyPath: "timestamp"
    });

    objectStore.createIndex("name", "name", {unique: true});
    objectStore.createIndex("semester", "semester", {unique: false});
    objectStore.createIndex("timetracks", "timetracks", {unique: false});
    objectStore.createIndex("actualMinutes", "actualMinutes", {unique: false});
    objectStore.createIndex("expectedHours", "expectedHours", {unique: false});
    objectStore.createIndex("identifier", "identifier", {unique: false});
    objectStore.createIndex("timestamp", "timestamp", {unique: true});
    objectStore.createIndex("lastEdited", "lastEdited", {unique: false});

    db.onerror = () => {
        window.alert("Connection to IndexedDB failed");
    }
}

DBOpenRequest.onsuccess = () => {
    db = DBOpenRequest.result;
    console.log("Connection to IndexedDB established");
    // window.alert("Connection to IndexedDB established");
    for (const fn of functionsToCallOnDbInit) {
        fn();
    }
}

function getSubjectsFromDb(successCallback, errorCallback, timestamp) {
    let transaction = db.transaction("Subjects", "readonly");
    let objectStore = transaction.objectStore("Subjects");
    let getAllRequest = timestamp ? objectStore.get(timestamp) : objectStore.getAll();

    transaction.oncomplete = () => {
        const subjects = getAllRequest.result;
        successCallback(subjects);
    };

    getAllRequest.onerror = (error) => {
        errorCallback(error);
    };
}


function addToDb(newSubject, onSuccessFn, onErrorFn) {
    let transaction = db.transaction("Subjects", "readwrite");
    let objectStore = transaction.objectStore("Subjects");
    let objectAddRequest = objectStore.add(newSubject);

    objectAddRequest.onsuccess = () => {
        console.log("Subject " + newSubject.name + " successfully added to the Database");
    };

    transaction.oncomplete = () => {
        if (onSuccessFn) {
            onSuccessFn();
        }
    };

    objectAddRequest.onerror = (error) => {
        console.log(error);
        if (onErrorFn) {
            onErrorFn();
        }
    };

    transaction.onerror = objectAddRequest.onerror;
}

function updateSubject(subject, onSuccessFn, onErrorFn) {
    let transaction = db.transaction("Subjects", "readwrite");
    let objectStore = transaction.objectStore("Subjects");
    let objectAddRequest = objectStore.put(subject);

    objectAddRequest.onsuccess = () => {
        console.log("Subject " + subject.name + " successfully updated to the Database");
    };

    transaction.oncomplete = () => {
        if (onSuccessFn) {
            onSuccessFn();
        }
    };

    objectAddRequest.onerror = (error) => {
        console.log(error);
        if (onErrorFn) {
            onErrorFn();
        }
    };

    transaction.onerror = objectAddRequest.onerror;
}

// language
const defaultLanguage = 0;
let language;
if (localStorage.getItem("language")) {
    language = localStorage.getItem("language");
} else {
    language = defaultLanguage;
}


function setLanguage(element, index) {
    element.addEventListener("click", () => {
        language = index;
        localStorage.setItem("language", JSON.stringify(language));
        location.reload();
    });
}

function setTranslations() {
    for (const element of document.querySelectorAll("[translation]")) {
        element.innerText = languagePack.get(element.getAttribute("translation"))[language];
    }
}

// index 0 = german, index 1 = english, index 2 = russian
const languagePack = new Map();
languagePack.set("locale", ["de-DE", "en-US", "ru-RU"]);
languagePack.set("edit", ["Ändern", "Edit", "Изменить"]);
languagePack.set("delete", ["Löschen", "Delete", "Удалить"]);
languagePack.set("subjects", ["Veranstaltungen", "Subjects", "Предметы"]);
languagePack.set("statistic", ["Statistik", "Statistics", "Статистика"]);
languagePack.set("settings", ["Einstellungen", "Settings", "Настройки"]);
languagePack.set("header", ["Zeiterfassung-App", "Time Tracker", "Тайм трекер"]);
languagePack.set("remove subject", ["Möchten Sie die Veranstaltung wirklich löschen?", "Do you really want to delete this subject?", "Вы действительно хотите удалить этот предмет?"]);
languagePack.set("action cannot be undone", ["Diese Aktion kann nicht rückgängig gemacht werden", "This action cannot be undone.", "Это действие является необратимым."]);
languagePack.set("study duration", ["Lerndauer", "Study duration", "Продолжительность обучения"]);
languagePack.set("edit the subject", ["Lehrveranstaltung ändern", "Edit the subject", "Редактирование предмета"]);
languagePack.set("subject name", ["Name:", "Name:", "Название предмета"]);
languagePack.set("semester", ["Semester:", "Semester:", "Семестр:"]);
languagePack.set("expected hours", ["Erwartete Stunden", "Expected hours", "Ожидаемые часы"]);
languagePack.set("add the subject", ["Lehrveranstaltung hinzufügen", "Add the subject", "Добавление предмета"]);
languagePack.set("backup server", ["Backup-Server", "Backup Server", "Бэкап сервер"]);
languagePack.set("save", ["Speichern", "Save", "Сохранить"]);
languagePack.set("cancel", ["Abbrechen", "Cancel", "Отменить"]);
languagePack.set("yes", ["Ja", "Yes", "Да"]);
languagePack.set("no", ["Nein", "No", "Нет"]);
languagePack.set("remaining study hours", ["Verbleibende Lernstunden", "Remaining study hours", "Оставшееся время"]);
languagePack.set("analysis of working hours per subject", ["Auswertung von Arbeitsstunden pro Veranstaltung", "Analysis of working hours per subject", "Анализ рабочих часов попредметно"]);
languagePack.set("overview of study effort per time period", ["Übersicht des Lernaufwands pro Zeitperiode", "Overview of study effort per time period", "Обзор учебной активности по периодам"]);
languagePack.set("heatmap", ["Heatmap", "Heatmap", "Тепловая карта"]);
languagePack.set("hours", ["Stunden", "Hours", "часов"]);
languagePack.set("minutes", ["Minuten", "Minutes", "минут"]);
languagePack.set("start time", ["Anfangszeit*", "Start time*", "Время начала*"]);
languagePack.set("end time", ["Endzeit*", "End time*", "Время окончания*"]);
languagePack.set("break duration", ["Dauer der Pause:", "Break duration:", "Продолжительность перерыва:"]);
languagePack.set("add the timetrack", ["Timetrack hinzufügen", "Add the timetrack", "Добавление таймтрека"]);
languagePack.set("german", ["Deutsch", "German", "Немецкий"]);
languagePack.set("english", ["Englisch", "Englisch", "Английский"]);
languagePack.set("russian", ["Russisch", "Russian", "Русский"]);
languagePack.set("change language", ["Sprache ändern", "Change language", "Изменить язык"]);
languagePack.set("subject", ["Veranstaltung", "Subject", "Предмет"]);
languagePack.set("semester", ["Semester", "Semester", "Семестр"]);
languagePack.set("of the planned", ["der geplanten", "of the planned", "от запланированных"]);
languagePack.set("edit the timetrack", ["Timetrack ändern", "Edit the timetrack", "Редактирование таймтрека"]);
languagePack.set("remove timetrack", ["Möchten Sie das Timetrack wirklich löschen?",
    "Do you really want to delete this timetrack?", "Вы действительно хотите удалить этот таймтрек?"]);
languagePack.set("timetrackPlaceholder", ["Keine Daten vorhanden.",
    "No data to display.", "Нет данных для отображения."]);
languagePack.set("connection failed", ["VERBINDUNG FEHLGESCHLAGEN", "CONNECTION FAILED", "СОЕДИНЕНИЕ НЕ УДАЛОСЬ"]);
languagePack.set("connection succeeded", ["VERBUNDEN", "CONNECTED", "ПОДКЛЮЧЕН К СЕРВЕРУ"]);
languagePack.set("list of backups", ["Liste der gespeicherten Backups auf dem Server:",
    "List of the saved Backups on the server:", "Список сохраненных резервных копий на сервере:"]);
languagePack.set("restore backup", ["Backup Anwenden", "Restore Backup", "Использовать резервную копию"]);
languagePack.set("connect to server", ["Mit Backup-Server verbinden", "Connect to Backup Server",
    "Подключение к серверу резервного копирования"]);
languagePack.set("username", ["Benutzername", "Username", "Имя пользователя"]);
languagePack.set("password", ["Passwort", "Password", "Пароль"]);
languagePack.set("server url toggle", ["Benutzerdefinierte Server-URL", "Custom Server URL", "Пользовательский aдрес сервера"]);
languagePack.set("server url", ["Server-URL", "Server URL", "Адрес сервера"]);
languagePack.set("connect", ["Verbinden", "Connect", "Подключение"]);
languagePack.set("server returned", ["Server liefert: ", "Server returned: ", "Сервер ответил: "]);
languagePack.set("server status", ["Status der Verbindung zum Server:", "Status of connection with Backup Server:",
    "Состояние соединения с сервером:"])
languagePack.set("send data to server", ["Aktuellen Datenstand sichern", "Backup current data set",
    "Резервная копия текущего набора данных"])
languagePack.set("time cannot run back",
    ["Die Zeit kann nicht zurücklaufen. Bitte wählen Sie ein Enddatum, das nach dem Startdatum liegt.",
        "Time cannot run backward. Please select an end date that comes after the start date.",
        "Время не может идти вспять. Пожалуйста, выберите конечную дату, которая идет после начальной."]);
languagePack.set("backup added to server", ["Aktuellen Datenstand wurde erfolgreich in Server gespeichert", "Current data set was successfully saved in server", "Текущее состояние данных было успешно сохранено на сервере"]);
languagePack.set("try again", ["Erneut versuchen", "Try again", "Повторить попытку"]);
languagePack.set("connection message", ["Die App konnte keine Verbindung zum Backup-Server herstellen",
    "The App could not establish connection to the Backup-Server",
    "Не удалось установить соединение с сервером резервного копирования"]);
languagePack.set("error when adding backup to db", ["FEHLER beim Hinzufügen des Backups zur Datenbank", "ERROR when adding backup to the database", "ОШИБКА при добавлении резервной копии в базу данных"]);
languagePack.set("backup deleted", ["Backup wurde erfolgreich vom Server gelöscht", "The backup was successfully deleted from server", "Резервная копия была успешно удалена с сервера"]);
languagePack.set("download button", ["Backup herunterladen", "Download backup", "Скачать резервную копию"]);
languagePack.set("upload button", ["Backup hochladen", "Upload backup", "Загрузить резервную копию"]);
languagePack.set("start equals to the end",
    ["Anfangszeit und Endzeit dürfen nicht gleich sein. Bitte geben Sie eine andere Anfangszeit oder Endzeit an.",
        "The end time cannot be the same as the start time. Please enter a different end date.",
        "Время начала и время окончания не могут совпадать. Пожалуйста, выберите конечную дату, которая идет после начальной."]);
languagePack.set("number of timetracks", ["Anzahl der Timetracks", "Number of timetracks", "Количество таймтреков"]);
languagePack.set("break desc", ["Pausendauer(А->a)", "break duration(А->a)", "времени перерыва(А->a)"]);
languagePack.set("alphabetically desc", ["alphabetisch(А->a)", "alphabetically(А->a)", "алфавиту(А->a)"]);
languagePack.set("alphabetically asc", ["alphabetisch(а->A)", "alphabetically(а->A)", "алфавиту(а->A)"]);
languagePack.set("date of creation desc", ["Erstellungsdatum(А->a)", "creation date(А->a)", "дате создания(А->a)"]);
languagePack.set("date of creation asc", ["Erstellungsdatum(а->A)", "creation date(а->A)", "дате создания(а->A)"]);
languagePack.set("break asc", ["Pausendauer(а->A)", "break duration(а->A)", "времени перерыва(а->A)"]);
languagePack.set("study desc", ["Unterrichtszeit(А->a)", "study duration(А->a)", "времени занятий(А->a)"]);
languagePack.set("study asc", ["Unterrichtszeit(а->A)", "study duration(а->A)", "времени занятий(а->A)"]);
languagePack.set("start time desc", ["Anfangszeit(А->a)", "start time(А->a)", "началу занятий(А->a)"]);
languagePack.set("start time asc", ["Anfangszeit(а->A)", "start time(а->A)", "началу занятий(а->A)"]);
languagePack.set("reset button", ["App zurücksetzen", "Reset app", "Сброс приложения"]);
languagePack.set("restore backup confirm message", [
    "Sind Sie sicher, dass Sie das Backup wiederherstellen wollen?\n" +
    "Ihr aktueller Datensatz wird dadurch gelöscht.\n" +
    "Sie können ein Backup davon erstellen.",
    "Are you sure you want to restore the backup?\n" +
    "Your current data set will be lost.\n" +
    "Please consider doing a backup of it.",
    "Вы уверены, что хотите восстановить резервную копию?\n" +
    "Ваш текущий набор данных будет потерян.\n" +
    "Рекомендуется сделать резервную копию."]);
languagePack.set("backup upload confirm", [
    "Die hochgeladene Datei wird Ihren aktuellen Datensatz ersetzen.\n" +
    "Wenn Sie Ihre Daten behalten möchten, erstellen Sie ein Backup.\n" +
    "Möchten Sie fortfahren?",
    "The uploaded file is going to replace your current data set.\n" +
    "If you want to keep your data, please make a backup.\n" +
    "Are you sure you want to proceed?",
    "Загруженный файл заменит ваш текущий набор данных.\n" +
    "Если вы хотите сохранить свои данные, пожалуйста, сделайте резервную копию.\n" +
    "Вы уверены, что хотите продолжить?"]);
languagePack.set("no file selected", ["Keine Datei ausgewählt", "No file selected", "Не выбран файл"]);
languagePack.set("only json files", ["ERROR: Nur JSON-Dateien erlaubt", "ERROR: Only JSON files allowed", "ОШИБКА: Разрешены только JSON-файлы"]);
languagePack.set("invalid backup file", [
    "Fehler beim Ersetzen der Datenbank durch Daten aus der Datei.\n" +
    "Bitte stellen Sie sicher, dass die ausgewählte Datei eine gültige Backup-Datei für diese Anwendung ist.",
    "Error when replacing the Database with data from the file.\n" +
    "Please make sure the selected file is a valid Backup file for this app.",
    "Ошибка при замене базы данных с данными из файла.\n" +
    "Убедитесь, что выбранный файл является действительным файлом резервной копии для этого приложения."]);
languagePack.set("no backups on server", ["Keine Backups auf dem Server vorhanden", "No backups available on the server", "На сервере нет резервных копий"])
languagePack.set("delete backup confrim", [
    "Das Backup wird vom Server gelöscht.\n" +
    "Dieser Vorgang kann nicht rückgängig gemacht werden.\n" +
    "Möchten Sie fortfahren?",
    "The backup will be deleted from the server.\n" +
    "This action cannot be undone.\n" +
    "Are you sure you want to proceed?",
    "Резервная копия будет удалена с сервера.\n" +
    "Это действие невозможно отменить.\n" +
    "Вы уверены, что хотите продолжить?"
]);
languagePack.set("db updated", ["Die Datenbank wurde erfolgreich aktualisiert", "The Database was successfully updated", "База данных успешно обновлена"]);
languagePack.set("backup restore confirm", [
    "Das Backup wird Ihren aktuellen Datensatz ersetzen.\n" +
    "Wenn Sie Ihre Daten behalten möchten, erstellen Sie ein Backup.\n" +
    "Möchten Sie fortfahren?",
    "The Backup is going to replace your current data set.\n" +
    "If you want to keep your data, please make a backup.\n" +
    "Are you sure you want to proceed?",
    "Резервная копия заменит ваш текущий набор данных.\n" +
    "Если вы хотите сохранить свои данные, пожалуйста, сделайте резервную копию.\n" +
    "Вы уверены, что хотите продолжить?"]);
languagePack.set("reset app confirm", [
    "The app will be reset and all of the data will be lost.\n" +
    "This action cannot be reversed.\n" +
    "Are you sure you want to proceed?",
    "Die App wird zurückgesetzt und alle Daten werden verloren gehen.\n" +
    "Dieser Vorgang kann nicht rückgängig gemacht werden.\n" +
    "Möchten Sie wirklich fortfahren?",
    "Приложение будет перезагружено, после чего все данные будут потеряны.\n" +
    "Это действие невозможно отменить.\n" +
    "Вы уверены, что хотите продолжить?\n"]);
languagePack.set("app reset", ["Die App wurde zurückgesetzt", "The app was successfully reset", "Приложение было сброшено"]);
languagePack.set("progress", ["Fortschritt", "Progress", "Прогресс"]);
languagePack.set("sort by", ["Sortieren nach", "Sort by", "Сортировать по"]);
languagePack.set("timetracker version", [`Timetracker Version ${versionNumber}`, `Timetracker version ${versionNumber}`, `Таймтрекер версия ${versionNumber}`]);
languagePack.set("hide completed", ["Abgeschlossene ausblenden", "Hide Completed", "скрыть выполненные"]);
languagePack.set("search placeholder", ["Suche...", "Search...", "Поиск..."]);
languagePack.set("hide with breaks", ["mit Pausen ausblenden", "hide with breaks", "скрыть с перерывами"]);
languagePack.set("break larger study", ["Die Dauer einer Pause darf nicht gleich oder länger als die Zeit des Studiums sein.",
    "The length of a break cannot be equal to or greater than the time of study.",
    "Продолжительность перерыва не может быть равной или больше времени занятия."]);

languagePack.set("january", ["Januar", "January", "Январь"]);
languagePack.set("february", ["Februar", "February", "Февраль"]);
languagePack.set("march", ["März", "March", "Март"]);
languagePack.set("april", ["April", "April", "Апрель"]);
languagePack.set("may", ["Mai", "May", "Май"]);
languagePack.set("june", ["Juni", "June", "Июнь"]);
languagePack.set("july", ["Juli", "July", "Июль"]);
languagePack.set("august", ["August", "August", "Август"]);
languagePack.set("september", ["September", "September", "Сентябрь"]);
languagePack.set("october", ["Oktober", "October", "Октябрь"]);
languagePack.set("november", ["November", "November", "Ноябрь"]);
languagePack.set("december", ["Dezember", "December", "Декабрь"]);

languagePack.set("mon", ["Mon", "Mon", "Пон"]);
languagePack.set("tue", ["Die", "Tue", "Вт"]);
languagePack.set("wed", ["Mit", "Wed", "Ср"]);
languagePack.set("thu", ["Don", "Thu", "Чет"]);
languagePack.set("fri", ["Fr", "Fr", "Пят"]);
languagePack.set("sat", ["Sam", "Sat", "Суб"]);
languagePack.set("sun", ["Son", "Sun", "Вск"]);
languagePack.set("low", ["Niedrig", "Low", "Низкий"]);
languagePack.set("medium", ["Mittel", "Medium", "Средний"]);
languagePack.set("high", ["Hoch", "High", "Высокий"]);

languagePack.set("jan", ["Jan", "Jan", "Янв"]);
languagePack.set("feb", ["Feb", "Feb", "Фев"]);
languagePack.set("mar", ["Mär", "Mar", "Мар"]);
languagePack.set("apr", ["Apr", "Apr", "Апр"]);
languagePack.set("may", ["Mai", "May", "Май"]);
languagePack.set("jun", ["Jun", "Jun", "Июн"]);
languagePack.set("jul", ["Jul", "Jul", "Июл"]);
languagePack.set("aug", ["Aug", "Aug", "Авг"]);
languagePack.set("sep", ["Sep", "Sep", "Сен"]);
languagePack.set("oct", ["Okt", "Oct", "Окт"]);
languagePack.set("nov", ["Nov", "Nov", "Ноя"]);
languagePack.set("dec", ["Dez", "Dec", "Дек"]);
languagePack.set("select", ["Wählen Sie Fach", "Select Subject", "Выберите предмет"]);
languagePack.set("select-month", ["Wählen Sie Monat", "Select Month", "Выберите месяц"]);

languagePack.set("ver-zeit", ["Verbleibende Zeit: ", "Remaining Time: ", "Потраченное время: "]);
languagePack.set("inv-zeit", ["Investierte Zeit: ", "Invested Time: ", "Оставшееся время: "]);

const german = document.getElementById("select-german-language");
setLanguage(german, 0);
const english = document.getElementById("select-english-language");
setLanguage(english, 1);
const russian = document.getElementById("select-russian-language");
setLanguage(russian, 2);

functionsToCallOnDbInit.push(loadServiceWorker);