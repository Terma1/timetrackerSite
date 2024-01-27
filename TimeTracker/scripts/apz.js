const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
const dpi = window.devicePixelRatio;
ctx.scale(1, 1);
ctx.font = '18px Arial';
function startApZBarChart(data) {
    canvas.innerHTML = "";
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    const barHeight = 25;
    const barSpacing = 15;
    const chartStartX = 55;
    const chartStartY = height - 35;
    const chartEndX = width - 20;
    const chartEndY = height - 30;
    const chartWidth = chartEndX - chartStartX - 50;
    const chartHeight = chartStartY - chartEndY;
    const maxValue = Math.max(...data.values);
    const numDivisionsX = 10;

    const xStep = chartWidth / numDivisionsX;
    const valueStep = maxValue / numDivisionsX;

    drawAxes();
    drawYAxisLabels();
    drawXAxisLabels();
    drawBars();

    function drawAxes() {
        ctx.beginPath();
        ctx.moveTo(chartStartX, chartStartY);
        ctx.lineTo(chartEndX, chartStartY);
        ctx.stroke();
    }

    function drawXAxisLabels() {
        for (let i = 0; i <= numDivisionsX; i++) {
            const x = chartStartX + xStep * i;
            const value = valueStep * i;
            ctx.fillText(value.toFixed(1), x, chartStartY + 20);
        }
    }

    function drawYAxisLabels() {
        for (let i = 0; i < data.labels.length; i++) {
            const y = chartStartY - (barHeight + barSpacing) * (i + 1) - barSpacing / 2;
            const truncatedLabel = data.labels[i].slice(0, 5);
            ctx.fillText(truncatedLabel || '', chartStartX - 40, y + barHeight / 2);
        }
    }
    function drawBars() {
        const color = '#FFA500';
        for (let i = 0; i < data.values.length; i++) {
            setTimeout(() => {
                const barWidth = (chartWidth / maxValue) * data.values[i];
                const x = chartStartX;
                const y = chartStartY - (barHeight + barSpacing) * (i + 1) - barSpacing;

                ctx.fillStyle = color;
                ctx.fillRect(x, y, barWidth, barHeight);
                ctx.fillStyle = '#000';
                canvas.style.transition = 'all 1s';
            }, i * 50);
        }
    }
}

function makeMonthButtons() {
    const months = [
        languagePack.get("january")[language],
            languagePack.get("february")[language],
            languagePack.get("march")[language],
            languagePack.get("april")[language],
            languagePack.get("may")[language],
            languagePack.get("june")[language],
            languagePack.get("july")[language],
            languagePack.get("august")[language],
            languagePack.get("september")[language],
            languagePack.get("october")[language],
            languagePack.get("november")[language],
            languagePack.get("december")[language]
    ];

    const selectElement = document.getElementById("subject-select");
    for (let i = 0; i < months.length; i++) {
        const optionElement = document.createElement("option");
        optionElement.textContent = months[i];
        selectElement.appendChild(optionElement);
    }
    
    selectElement.addEventListener("change", function() {
        const selectedIndex = selectElement.selectedIndex;
        createDataApZ(selectedIndex);
    });
    createDataApZ(0);
}
functionsToCallOnDbInit.push(createDataApZ);
functionsToCallOnDbInit.push(makeMonthButtons);
function createDataApZ(month){
    const data = {
        labels:[],
        values: [],
    };
    getSubjectsFromDb(
        subjects => {
            for (const subject of subjects) {
                data.labels.push(subject.name);
                const hours = countHours(month, subject);
                data.values.push(hours);
            }
            startApZBarChart(data)
    },
    error => {
        console.error(error);
    }
    );
    
}
function countHours(month, subject) {
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