setTranslations();

let connectToServerPopup = document.getElementById("connect-to-server-popup");

let backupServerButton = document.getElementById("backup-server-button");
backupServerButton.addEventListener("click", () => {
    checkIfCredentialsInSessionStorage();
});


let uploadButton = document.getElementById("upload-button");
uploadButton.addEventListener("click", () => {
    uploadBackupFile();
})


let connectToServerPopupForm = document.getElementById("connect-to-server-popup-form");
connectToServerPopupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    takeCredentialsFromPopupAndTryConnectionWithServer();
});

let connectToServerPopupCancelButton = document.getElementById("connect-to-server-popup-cancel-button");
connectToServerPopupCancelButton.addEventListener("click", () => {
    closeConnectToServerPopup();
});

let appResetButton = document.getElementById("reset-button")
appResetButton.addEventListener("click", resetApp);

function checkIfCredentialsInSessionStorage() {
    let header = sessionStorage.getItem("backupServerCredentials");
    let url = sessionStorage.getItem("backupServerURL");

    if (header !== null && url != null) {
        window.location.href = 'backup-server.html';
    } else {
        openConnectToServerPopup();
    }
}

function takeCredentialsFromPopupAndTryConnectionWithServer() {
    let formElements = connectToServerPopupForm.elements;
    let formInputUsername = formElements["username"].value;
    let formInputPassword = formElements["password"].value;
    let formInputURL = formElements["url"].value;

    tryConnectionWithServer(formInputURL, generateAuthenticationHeader(formInputUsername, formInputPassword));
}


function openConnectToServerPopup() {
    let connectToServerPopupMessage = document.getElementById("connect-to-server-popup-message");
    connectToServerPopupMessage.innerText = ""; //clear if needed

    let connectToServerPopupFormInputURL = document.getElementById("connect-to-server-popup-form-input-url");
    connectToServerPopupFormInputURL.value = "http://127.0.0.1:8081";
    connectToServerPopupFormInputURL.disabled = true;

    let connectToServerCustomURLToggle = document.getElementById("connect-to-server-popup-form-input-url-toggle");
    connectToServerCustomURLToggle.addEventListener("change", () => {
        connectToServerPopupFormInputURL.disabled = !connectToServerCustomURLToggle.checked;
    })
    connectToServerPopup.showModal();
}

function closeConnectToServerPopup() {
    connectToServerPopupForm.reset();
    connectToServerPopup.close();
}

function tryConnectionWithServer(url, header) {
    let errorMessage
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.setRequestHeader("Authorization", header);
    xhr.send();
    xhr.onload = () => {
        if (xhr.statusText === "OK" && xhr.status === 200) {
            console.log(xhr.response);
            connectionToServerSucceeded(url, header);

        } else {
            errorMessage = xhr.status + " " + xhr.statusText;
            connectionToServerFailed(errorMessage)
        }

    };
    xhr.onerror = (err) => {
        if (xhr.status === 0) {
            errorMessage = "CONNECTION REFUSED";
        } else {
            errorMessage = xhr.status + " " + xhr.statusText;
        }
        console.log(errorMessage);
        connectionToServerFailed(errorMessage);
    }
}

function connectionToServerSucceeded(url, header) {
    //save header and url in session storage
    sessionStorage.setItem("backupServerCredentials", header);
    sessionStorage.setItem("backupServerURL", url);

    //close popup and go to backup server page
    connectToServerPopupForm.reset();
    connectToServerPopup.close();
    window.location.href = 'backup-server.html';
}

function connectionToServerFailed(errorMessage) {
    let connectToServerPopupMessage = document.getElementById("connect-to-server-popup-message");
    connectToServerPopupMessage.innerText = "";

    connectToServerPopupMessage.innerText = languagePack.get("connection failed")[language] + "\n";
    connectToServerPopupMessage.innerText += languagePack.get("server returned")[language] + errorMessage;

    connectToServerPopupMessage.style.color = "red";
}

function uploadBackupFile() {
    let isConfirmed = confirm(languagePack.get("backup upload confirm")[language]);
    if (isConfirmed) {
        let input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "application/json"); //accept only json files

        input.addEventListener("change", (event) => {
            //get file
            let file = event.target.files[0];
            if (!file) {
                //if no file display error message
                alert(languagePack.get("no file selected")[language]);
                return;
            }
            if (file.type !== "application/json") {
                //if user somehow managed to upload a file that is not json
                alert(languagePack.get("only json files")[language]);
                return;
            }
            let fileReader = new FileReader();
            fileReader.readAsText(file);
            let contents, backup;
            fileReader.onload = (event) => {
                //get file contents
                contents = event.target.result.toString();
                backup = new Backup(JSON.parse(contents));
            };
            fileReader.onloadend = () => {
                try {
                    if (backup.subjects.length > 0) {
                        replaceIndexedDBWithBackup(backup);
                    }
                } catch (error) {
                    alert(languagePack.get("invalid backup file")[language]);
                    console.log(error);
                }

            }

        })
        input.click();
    }

}

function resetApp() {
    let isConfirmed = confirm(languagePack.get("reset app confirm")[language]);
    if (isConfirmed) {
        sessionStorage.clear();

        let transaction = db.transaction(["Subjects"], "readwrite");
        let objectToDelete = transaction.objectStore("Subjects");

        objectToDelete.clear().onsuccess = function(e){
            alert(languagePack.get("app reset")[language]);
        }
    }



}