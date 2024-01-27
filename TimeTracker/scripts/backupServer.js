class BackupsList {
    constructor(object) {
        if (object) {
            for (const key of Object.keys(object)) {
                this[key] = object[key];
                let i = 0;
                for (const backup of object[key]) {
                    this[key][i] = new Backup(backup);
                    i++;
                }
            }
            return;
        }

        this.backups = [];
    }
}

setTranslations();


let statusElement = document.getElementById("backup-server-status");
let backupServerContent = document.getElementById("backup-server-content");

let backupServerCredentials = sessionStorage.getItem("backupServerCredentials");
let backupServerURL = sessionStorage.getItem("backupServerURL").trim();
if (backupServerURL.charAt(backupServerURL.length - 1) === "/") {
    backupServerURL = backupServerURL.substring(0, backupServerURL.length - 1);
}
function connectToServer () {
    let auth = backupServerCredentials;
    let address = new URL(backupServerURL);
    const xhr = new XMLHttpRequest();
    xhr.open("GET", address);
    xhr.setRequestHeader("Authorization", auth);

    xhr.send();
    //xhr.responseType = "text";
    xhr.onload = () => {
        if (xhr.statusText === "OK" && xhr.status === 200) {
            console.log(xhr.response);
            connectionSucceeded();

        } else {
            connectionFailed();
        }
    };
    xhr.onerror = (err) => {
        console.log("Error: " + xhr.status + " " + xhr.statusText);
        connectionFailed();
    }
}

function connectionFailed() {

    let backupsListContainer = document.getElementById("backups-list-container");
    backupsListContainer.innerHTML = "";

    statusElement.innerHTML = "";
    statusElement.innerText = languagePack.get("connection failed")[language];

    let statusContainer = document.getElementById("backup-server-status-container");
    statusContainer.style["background-image"] = "linear-gradient(to top, #f77062 0%, #fe5196 100%)";
    statusElement.innerText += "\n" + languagePack.get("connection message")[language];

    let buttonContainer = document.getElementById("backup-server-button-container");
    buttonContainer.innerHTML = "";

    let tryAgainButton = document.createElement("button");
    tryAgainButton.setAttribute("class", "global-buttons");
    tryAgainButton.setAttribute("id", "try-again-button");
    tryAgainButton.innerText = languagePack.get("try again")[language];
    tryAgainButton.addEventListener("click", () => connectToServer());
    buttonContainer.append(tryAgainButton);

    //backupServerContent.append(buttonContainer);
}

function connectionSucceeded() {

    statusElement.innerHTML = "";
    statusElement.innerText = languagePack.get("connection succeeded")[language];

    let statusContainer = document.getElementById("backup-server-status-container");
    statusContainer.style["background-image"] = "linear-gradient(-20deg, #00cdac 0%, #8ddad5 100%)";

    let buttonContainer = document.getElementById("backup-server-button-container");
    buttonContainer.innerHTML = "";

    let sendDataToServerButton = document.createElement("button");
    sendDataToServerButton.setAttribute("class", "global-buttons");
    sendDataToServerButton.setAttribute("id", "send-to-server-button");
    sendDataToServerButton.setAttribute("translation", "send data to server");
    sendDataToServerButton.innerText = languagePack.get("send data to server")[language];
    sendDataToServerButton.addEventListener("click", () => {
        getBackupFromIndexedDB(true);
    });
    buttonContainer.append(sendDataToServerButton);

    getBackupsListFromServer();
}

//parameter sendToServer decides if you send the backup to a server
function getBackupFromIndexedDB(sendToServer) {
    let transaction = db.transaction("Subjects", "readonly");
    let objectStore = transaction.objectStore("Subjects");

    let newBackup = new Backup();

    //take all subjects from IndexedDB and
    objectStore.openCursor().onsuccess = (event) => {

        const cursor = event.target.result; //current item in the DB
        //check if there are no more cursor items to iterate through
        if (!cursor) {
            //no more items, quit.
            if(sendToServer === true) {
                console.log(JSON.stringify(newBackup));
                sendBackupToServer(newBackup);
            }
            return;
        }
        let subject = new Subject(cursor.value);
        //take element from the IndexedDB and add it to backup object
        newBackup.addSubjectToDatabase(subject);
        //continue on to the next item in DB
        cursor.continue();
    };

}

function sendBackupToServer(backup) {
    let auth = backupServerCredentials;
    const xhr = new XMLHttpRequest();
    let address = new URL(backupServerURL + "/backup");
    xhr.open("POST", address);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", auth);
    xhr.send(JSON.stringify(backup));
    //xhr.responseType = "text";
    xhr.onload = () => {
        if (xhr.statusText === "OK" && xhr.status === 200) {
            console.log(xhr.response);
            alert(languagePack.get("backup added to server")[language]);
            getBackupsListFromServer();

        } else {
            alert(xhr.statusText);
            //connectionFailed();
        }
    };
    xhr.onerror = (err) => {
        connectionFailed();
        console.log("Error: " + xhr.status);
        console.log("Backup could not be sended to the server");
        //connectionFailed();
    }

}


function getBackupsListFromServer() {
    let auth = backupServerCredentials;
    let address = new URL(backupServerURL + "/backup");
    let backupsList;
    const xhr = new XMLHttpRequest();
    xhr.open("GET", address);
    xhr.setRequestHeader("Authorization", auth);
    xhr.responseType = "json";
    xhr.send();
    xhr.onload = () => {
        if (xhr.statusText === "OK" && xhr.status === 200) {
            console.log(xhr.response);
            backupsList = new BackupsList(xhr.response);
            console.log("posle" + backupsList);
            refreshBackupsListInDocument(backupsList);

        }
        else if (xhr.statusText === "No Content" && xhr.status === 204) {
            console.log("Error: " + xhr.status + " " + xhr.statusText);
            showNoBackupsMessage();
        }


        else {
            console.log("Error: " + xhr.status + " " + xhr.statusText);
        }
    };
    xhr.onerror = (err) => {
        console.log("Error: " + xhr.status + " " + xhr.statusText);
    }

}

function refreshBackupsListInDocument(backupsList) {
    let backupsListContainer = document.getElementById("backups-list-container");
    //clear if there are old elements
    backupsListContainer.innerHTML = "";

    let backupsListHeader = document.createElement("div");
    backupsListHeader.setAttribute("class", "divider-with-background");
    backupsListHeader.setAttribute("id", "backups-list-header");
    backupsListHeader.innerText = languagePack.get("list of backups")[language];
    backupsListContainer.append(backupsListHeader);

    backupsList.backups.sort((el1, el2) => {
        return el2.time.localeCompare(el1.time);
    });
    for (let backup of backupsList.backups) {
        addBackupToDocument(backup);
    }


}

function showNoBackupsMessage() {
    let backupsListContainer = document.getElementById("backups-list-container");
    //clear if there are old elements
    backupsListContainer.innerHTML = "";

    let backupsListHeader = document.createElement("div");
    backupsListHeader.setAttribute("class", "divider-with-background");
    backupsListHeader.setAttribute("id", "backups-list-header");
    backupsListHeader.innerText = languagePack.get("no backups on server")[language];
    backupsListContainer.append(backupsListHeader);

}

function addBackupToDocument(backup) {
    let backupsListContainer = document.getElementById("backups-list-container");

    let backupElementContainer = document.createElement("div");
    backupElementContainer.setAttribute("class", "global-list-element-container");
    backupElementContainer.setAttribute("id", "backup-element-container");

    let backupElementNameButton = document.createElement("button");
    backupElementNameButton.setAttribute("class", "global-buttons global-list-element-name-button");
    backupElementNameButton.setAttribute("id", "backup-element-name-button");
    backupElementNameButton.innerText = backup.time;
    backupElementNameButton.addEventListener("click", () => restoreBackupFromServer(backup));

    let backupElementDownloadButton  = document.createElement("button");
    backupElementDownloadButton.setAttribute("class", "global-buttons global-list-element-option-button");
    backupElementDownloadButton.innerText = languagePack.get("download button")[language];
    backupElementDownloadButton.addEventListener("click", () => downloadBackupFromServer(backup));

    let backupElementUseButton  = document.createElement("button");
    backupElementUseButton.setAttribute("class", "global-buttons global-list-element-option-button");
    backupElementUseButton.innerText = languagePack.get("restore backup")[language];
    backupElementUseButton.addEventListener("click", () => restoreBackupFromServer(backup));


    let backupElementDeleteButton = document.createElement("button");
    backupElementDeleteButton.setAttribute("class", "global-buttons global-list-element-option-button");
    backupElementDeleteButton.innerText = languagePack.get("delete")[language];
    backupElementDeleteButton.addEventListener("click", () => deleteBackupFromServer(backup));

    let backupElementOptionContainer = document.createElement("div");
    backupElementOptionContainer.setAttribute("class", "global-list-element-option-container");
    backupElementOptionContainer.setAttribute("id", "backup-element-option-container")

    backupElementOptionContainer.append(backupElementDownloadButton, backupElementUseButton, backupElementDeleteButton)

    backupElementContainer.append(backupElementNameButton, backupElementOptionContainer);

    backupsListContainer.append(backupElementContainer);

}

function deleteBackupFromServer(backup) {
    let isConfirmed = confirm(languagePack.get("delete backup confrim")[language]);
    if (isConfirmed) {
        let auth = backupServerCredentials;
        let address = new URL(backupServerURL + "/backup/" + backup.time + ".json");
        const xhr = new XMLHttpRequest();
        xhr.open("DELETE", address);
        xhr.setRequestHeader("Authorization", auth);
        xhr.send();
        xhr.onload = () => {
            if (xhr.statusText === "OK" && xhr.status === 200) {
                console.log(xhr.response);
                alert(languagePack.get("backup deleted")[language]);
                getBackupsListFromServer();

            } else {
                alert("Error: " + xhr.status);
            }
        };
        xhr.onerror = (err) => {
            console.log("Error: " + xhr.status);
            connectionFailed();
        }
    }

}

function restoreBackupFromServer(backup) {

    let isConfirmed = confirm(languagePack.get("backup restore confirm")[language]);
    if (isConfirmed) {
        let auth = backupServerCredentials;
        let address = new URL(backupServerURL + "/backup/" + backup.time + ".json");

        const xhr = new XMLHttpRequest();
        xhr.open("GET", address);
        xhr.setRequestHeader("Authorization", auth);
        xhr.send();
        xhr.responseType = "json";
        xhr.onload = () => {
            if (xhr.statusText === "OK" && xhr.status === 200) {
                backup = new Backup(xhr.response);
                replaceIndexedDBWithBackup(backup);
            } else {
                alert("Error: " + xhr.status);
                console.log("Error: " + xhr.status);
            }
        };
        xhr.onerror = (err) => {
            console.log("Error: " + xhr.status);
            connectionFailed();
        }

    }


}

function downloadBackupFromServer(backup) {
    let auth = backupServerCredentials;
    let address = new URL(backupServerURL + "/backup/" + backup.time + ".json");

    //fetch file and return response as blob
    fetch(address, {
        headers: {
            "Authorization" : auth,
        }
    }).then(res => res.blob()).then(file => {
        //create temporary url for the passed object
        let tempUrl = URL.createObjectURL(file);
        console.log(tempUrl);

        let aTag = document.createElement("a");
        aTag.setAttribute("href", tempUrl);
        aTag.setAttribute("download", backup.time);
        document.body.appendChild(aTag);
        aTag.click(); //click the tag so that the download begins
        aTag.remove();  //remove the tag after the file is downloaded
    })
}



connectToServer();
getBackupsListFromServer();