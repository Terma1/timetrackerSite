document.getElementById('btnRemainingHours').addEventListener('click', function() {
    openNewWindow('Verbleibende Arbeitsstunden');
});

document.getElementById('btnHourEvaluation').addEventListener('click', function() {
    openNewWindow('Auswertung von Arbeitsstunden pro Veranstaltung');
});

document.getElementById('btnHourOverview').addEventListener('click', function() {
    openNewWindow('Übersicht Arbeitsstunden pro Zeitperiode');
});

document.getElementById('btnHeatmap').addEventListener('click', function() {
    openNewWindow('Heatmap');
});

function openNewWindow(message) {
    var newWindow = window.open('about:blank', '_blank');
    newWindow.document.write('<html><head><title>New Window</title></head><body>');
    newWindow.document.write('<h1>' + message + '</h1>');
    newWindow.document.write('</body></html>');
    newWindow.document.close();
}
