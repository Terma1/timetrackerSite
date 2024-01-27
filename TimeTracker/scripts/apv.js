const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
const dpi = window.devicePixelRatio;
ctx.scale(1,1);
ctx.font = '14px Arial';
function startBarChart(data){
    canvas.innerHTML = "";
    const width = canvas.width;
    const height = canvas.height+28;
    ctx.clearRect(0, 0, width, height);
    const barWidth = 45;
    const barSpacing = 18;
    const chartStartX = 40;
    const chartStartY = height - 70;
    const chartEndX = width + 100;
    const chartEndY = 50;
    const chartWidth = chartEndX - chartStartX;
    const chartHeight = chartStartY - chartEndY;
    const maxValue = Math.max(...data.values);
    const monthColors = [
    '#7B68EE',
    '#00BFFF',
    '#7FFFD4',
    '#66CDAA',
    '#6B8E23',
    '#228B22',
    '#32CD32',
    '#FFD700',
    '#FF8C00',
    '#FF6347',
    '#F0E68C',
    '#ADD8E6'
];
drawAxes();
drawYAxisLabels();
drawXAxisLabels();
drawBars();
function drawAxes() {
    ctx.beginPath();
    ctx.moveTo(chartStartX, chartStartY);
    ctx.lineTo(chartEndX, chartStartY);
    ctx.lineTo(chartEndX, chartEndY);
    ctx.stroke();
}

function drawYAxisLabels() {
    for (let i = 0; i <= 5; i++) {
        const y = chartStartY - (chartHeight / 5) * i;
        ctx.fillText(((maxValue / 5) * i).toFixed(1), chartStartX - 30, y);
    }
}

function drawXAxisLabels() {
    for (let i = 0; i <= 11; i++) {
        const x = chartStartX + (barWidth + barSpacing) * i + (barSpacing + barWidth - 10) / 2;
        ctx.fillText(data.labels[i], x, chartStartY + 12);
    }
}

function drawBars() {
    for (let i = 0; i < data.values.length; i++) {
        setTimeout(() => {
            const barHeight = (chartHeight / maxValue) * data.values[i];
            const x = chartStartX + (barWidth + barSpacing) * i + barSpacing;
            const y = chartStartY - barHeight;

            const color = monthColors[i];
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth, barHeight);
            ctx.fillStyle = '#000';
            ctx.fillText(
                `${data.values[i].toFixed(1)}`,
                x + barWidth / 2-11,
                chartStartY + 25
            );
            canvas.style.transition = 'all 0.5s';
        }, i * 50);
    }
}
}


function valueInMonth(month, subject) {
    let sum = 0;
    for (let i = 0; i < subject.timetracks.length; i++) {
        const startDateMonth = subject.timetracks[i].startDate.getMonth();
        const endDateMonth = subject.timetracks[i].endDate.getMonth();
        if (startDateMonth === month && endDateMonth === month) {
            sum += (subject.timetracks[i].endDate - subject.timetracks[i].startDate) / (1000 * 60 * 60);
        } else if (startDateMonth < month && endDateMonth === month) {
            sum += (subject.timetracks[i].endDate - new Date(month, 0, 1)) / (1000 * 60 * 60);
        } else if (startDateMonth === month && endDateMonth > month) {
            sum += (new Date(month + 1, 0, 1) - subject.timetracks[i].startDate) / (1000 * 60 * 60);
        }
    }
    return sum;
}
function createData(subject) {
    const data = {
        labels: [
            languagePack.get("jan")[language],
            languagePack.get("feb")[language],
            languagePack.get("mar")[language],
            languagePack.get("apr")[language],
            languagePack.get("may")[language],
            languagePack.get("jun")[language],
            languagePack.get("jul")[language],
            languagePack.get("aug")[language],
            languagePack.get("sep")[language],
            languagePack.get("oct")[language],
            languagePack.get("nov")[language],
            languagePack.get("dec")[language]
        ],
        values: [],
    };

    for (let i = 0; i < 12; i++) {
        const value = valueInMonth(i, subject);
        data.values.push(value);
    }
    startBarChart(data);
}
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
                createData(selectedSubject);
            });
            createData(subjects[0]);
        },
        error => {
            console.error(error);
        }
    );
}