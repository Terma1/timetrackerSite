function makeDataForHeatmap(subject) {
    data = {
        labels: [],
        values: [],
    };
                for (const timetrack of subject.timetracks) {
                    const startDate = timetrack.startDate;
                    const startYear = startDate.getFullYear();
                    const startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
                    const startDay = startDate.getDate().toString().padStart(2, '0');
                    const date = new Date(`${startYear}-${startMonth}-${startDay}`);
                    const formattedStartDate = date.toISOString().split('T')[0];
                    const endDate=timetrack.endDate;
                    const edate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), endDate.getHours(), endDate.getMinutes());
                    const formattedEndDate = edate.toISOString().split('T')[0];
                    while (edate.toISOString().split('T')[0] >= formattedStartDate) {
                        let value = valueInTimeTrackNotSameDate(timetrack, edate);
                        console.log(value);
                        data.labels.push(edate.toISOString().split('T')[0]);
                        data.values.push(value);
                        edate.setDate(edate.getDate() - 1);
                    }
                }
            console.log(data);
            renderCalendar(0, data);

}
function valueInTimeTrackNotSameDate(timetrack, currentDate) {
    const startDate = timetrack.startDate;
    const endDate = timetrack.endDate;
    console.log(currentDate.toDateString());
    console.log(startDate);
    console.log(endDate);
    if (startDate.toDateString() !== currentDate.toDateString() && endDate.toDateString() !== currentDate.toDateString()) {
        return 24;
    } else if (endDate.toDateString() === currentDate.toDateString() && startDate.toDateString()!==currentDate.toDateString()) {
        const hours = endDate.getHours();
        const minutes = endDate.getMinutes();
        return hours + minutes / 60;
    } else if (startDate.toDateString() === currentDate.toDateString() && endDate.toDateString() !== currentDate.toDateString()) {
        const hours = startDate.getHours();
        const minutes = startDate.getMinutes();
        return 24 - (hours + minutes / 60);
    } else {
        const durationInHours = (endDate - startDate) / (1000 * 60 * 60);
        return durationInHours;
    }
}



const calendarContainer = document.getElementById('heatmapCalendar');
const currentMonthElement = document.getElementById('currentMonth');
let currentMonth = 9;
let currentYear = 2023;
let data;
functionsToCallOnDbInit.push(initPageApV);
function initPageApV() {
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
                makeDataForHeatmap(selectedSubject);
            });
            makeDataForHeatmap(subjects[0]);
        },
        error => {
            console.error(error);
        }
    );
}

function renderCalendar(monthOffset = 0, data) {
    currentMonth += monthOffset;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

    calendarContainer.innerHTML = '';
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < dayLabels.length; i++) {
        const labelCell = document.createElement('div');
        labelCell.classList.add('day-label');
        labelCell.textContent = `${languagePack.get(dayLabels[i].toLowerCase())[language]}`;
        calendarContainer.appendChild(labelCell);
    }
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('empty-cell');
        calendarContainer.appendChild(emptyCell);
    }

    for (let i = 1; i <= lastDate; i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell');
        dayCell.textContent = i;
        const date = new Date(currentYear, currentMonth, i+1);
        const dateString = date.toISOString().split('T')[0];

        const dataIndex = data.labels.indexOf(dateString);
        if (dataIndex !== -1) {
            const value = data.values[dataIndex];
            console.log(value);
            const maxValue = Math.max(...data.values);
            if (value<=(maxValue/3)&& value>0) {
                dayCell.style.backgroundColor = '#d9f0a3';
            } else if (value <= (2*maxValue)/3) {
                dayCell.style.backgroundColor = '#7ec8a3';
            } else {
                dayCell.style.backgroundColor = '#3e824e';
                dayCell.style.color = '#fff';
            }
        }

        calendarContainer.appendChild(dayCell);
    }
    const monthNames = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];
    currentMonthElement.textContent = `${languagePack.get(monthNames[currentMonth].toLowerCase())[language]} ${currentYear}`;

    const prevMonthArrow = document.getElementById('prevMonth');
    if (currentYear === 2023 && currentMonth === 9) {
        prevMonthArrow.style.visibility = 'hidden';
    } else {
        prevMonthArrow.style.visibility = 'visible';
    }

    const nextMonthArrow = document.getElementById('nextMonth');
    if (currentYear === 2024 && currentMonth === 8) {
        nextMonthArrow.style.visibility = 'hidden';
    } else {
        nextMonthArrow.style.visibility = 'visible';
    }
}

function changeMonth(offset) {
    renderCalendar(offset, data);
}