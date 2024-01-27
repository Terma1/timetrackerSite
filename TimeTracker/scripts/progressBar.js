function drawChart(subject) {
    if(subject.actualMinutes===0){
        startProgressBar(0);
        updateText(subject.name);
        const actualHours = parseFloat(subject.actualMinutes) / 60.0;
        updateTime((actualHours),(subject.expectedHours-actualHours));
    }
    else{
        const actualHours = parseFloat(subject.actualMinutes) / 60.0;
        const expectedHours = parseFloat(subject.expectedHours);
        const percentage = Math.min((actualHours / expectedHours) * 100.0, 100);
        startProgressBar(percentage);
        updateText(subject.name);
        updateTime((actualHours),(Math.max(subject.expectedHours - actualHours, 0)));
    }
}

function startProgressBar(percentage) {
    let circularProgress = document.querySelector(".circular-progress"),
        progressValue = document.querySelector(".progress-value");
    let progressStartValue = -1,
        progressEndValue = percentage.toFixed(0),
        speed = 8;
    let progress = setInterval(() => {
        progressStartValue++;
        progressValue.textContent = `${progressStartValue}%`
        circularProgress.style.background = `conic-gradient(#7d2ae8 ${progressStartValue * 3.6}deg, #ededed 0deg)`
        if (progressStartValue == progressEndValue) {
            clearInterval(progress);
        }
    }, speed);
}

function setTranslations() {
}

function updateText(selectedSubject) {
    document.querySelector(".text").textContent = selectedSubject;
}

function updateTime(invertedTime, remainingTime) {
    invertedTime = parseFloat(invertedTime);
    remainingTime = parseFloat(remainingTime);

    const invertedHours = Math.floor(invertedTime);
    const invertedMinutes = Math.round((invertedTime - invertedHours) * 60);

    const remainingHours = Math.floor(remainingTime);
    const remainingMinutes = Math.round((remainingTime - remainingHours) * 60);

    const formatTime = (hours, minutes) => {
        return `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
    };

    document.querySelector(".inverted-time").textContent = formatTime(invertedHours, invertedMinutes);
    document.querySelector(".remaining-time").textContent = formatTime(remainingHours, remainingMinutes);
}
functionsToCallOnDbInit.push(initPage);

function initPage() {
    getSubjectsFromDb(
        subjects => {
            const selectElement = document.getElementById("subject-select");

            for (const subject of subjects) {
                const optionElement = document.createElement("option");
                optionElement.textContent = subject.name;
                selectElement.appendChild(optionElement);
            }
            selectElement.addEventListener("change", function () {
                const selectedIndex = selectElement.selectedIndex;
                const selectedSubject = subjects[selectedIndex];
                drawChart(selectedSubject);
            });

            drawChart(subjects[0]);
        },
        error => {
            console.error(error);
        }
    );
}

function onSubjectButtonClick(id) {
    getSubjectsFromDb(
        subjects => {
            for (const subject of subjects){
                if (subject.id===id){
                    drawChart(subject);
                }
            }

        });

}