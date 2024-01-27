// functions
function createAndEnterSubject(name, semester, time) {
    cy.visit('/html/main.html');
    cy.get("button").contains("+").click();
    cy.get("#add-subject-popup-form-input-subject-name").type(`Subject Number 1`);
    cy.get("#add-subject-popup-form-input-subject-semester").type(`WS2023`);
    cy.get("#add-subject-popup-form-input-required-hours").type(`100`);
    cy.get("button").contains("Speichern").click();
    cy.get(".global-list-element-name-button").contains("Subject Number 1").click();
}

function deleteSubject(name) {
    cy.get(".menu-buttons").contains("Veranstaltungen").click();
    cy.contains(".global-list-element-name-button", name).parent(".global-list-element-container").within(() => {
        cy.get("button").contains("Löschen").click();
    });
    cy.get("#delete-subject-popup-form-confirm-button").contains("Ja").click();
}

function createTimetrackWithoutPauseDuration(start, end) {
    cy.get("#add-timetrack-button").contains("+").click();
    cy.get("#start-date-add-popup").type(start);
    cy.get("#end-date-add-popup").type(end);
    cy.get("button").contains("Speichern").click();
}

function createTimetrackWithPauseDuration(start, end, pauseHours, pauseMinutes) {
    cy.get("#add-timetrack-button").contains("+").click();
    cy.get("#start-date-add-popup").type(start);
    cy.get("#end-date-add-popup").type(end);
    cy.get("#break-duration-hours-add-popup").type(pauseHours);
    cy.get("#break-duration-minutes-add-popup").type(pauseMinutes);
    cy.get("button").contains("Speichern").click();
}


function deleteTimetrackWithoutPauseDuration(date) {
    it("deleting timetrack", () => {
        cy.contains(".global-list-element-name-button", date)
            .parent(".global-list-element-container").within(() => {
            cy.get("button").contains("Löschen").click();
        });
        cy.get(".global-popup-form-confirm-button").contains("Ja").click();
    });
}

function editTimetrackWithoutPauseDuration(start, end) {
    cy.get(".global-list-element-option-button").contains("Ändern").click();
    cy.get("#start-date-edit-popup").type(start);
    cy.get("#end-date-edit-popup").type(end);
    cy.get(".global-popup-form-confirm-button").contains("Ändern").click();
}

function checkProgressPercent(percent) {
    cy.get("#progression-subject").invoke("text").should("eq", `Fortschritt: ${percent}% der geplanten 100 Stunden`);
}

function checkNumberOfTimetracks(number) {
    cy.get("#number-of-timetracks").invoke("text").should("eq", `Anzahl der Timetracks: ${number}`);
}


describe('template spec', () => {
    it("should hide elements with pause duration when Hide with breaks checkbox is checked", () => {
        createAndEnterSubject("Subject Number 1", "WS2023", "100");
        createTimetrackWithPauseDuration("2024-01-22T13:00", "2024-01-23T13:00", "1", "0");
        cy.get("#hideWithBreakCheckbox").check();
        cy.get(".placeholder").invoke("text").should("eq", "Keine Daten vorhanden.");
        deleteSubject("Subject Number 1");
    });


    describe("creating first timetrack", () => {
        beforeEach(() => {

            createAndEnterSubject("Subject Number 1", "WS2023", "100");
        });
        afterEach(() => {
            deleteSubject("Subject Number 1");
        });

        it("checks subject name", () => {
            cy.get("#subject-name").invoke("text").should("eq", "Veranstaltung: Subject Number 1");
        });
        it("checks semester number", () => {
            cy.get("#semester-number").invoke("text").should("eq", "Semester: WS2023");
        });
        it("Checks existent of placeholder if no timetracks are added", () => {
            cy.get(".placeholder").invoke("text").should("eq", "Keine Daten vorhanden.");
        });
        it("checks number of timetracks if no timetracks are added", () => {
            checkNumberOfTimetracks(0);
        });
        it("checks progress percents if no timetracks are added", () => {
            checkProgressPercent(0);
        });
        it("should successfully add a new timetrack without setting pause duration", () => {
            createTimetrackWithoutPauseDuration("2024-01-22T13:00", "2024-01-23T13:00");

            cy.get(".global-list-element-name-button").should("contain.text", "22. Januar 2024 um 13:00.Lerndauer: 24 Stunden 0 Minuten .Dauer der Pause: 0 Minuten");

        });
    });
    describe("deleting/adding timetrack", () => {
        beforeEach(() => {
            createAndEnterSubject("Subject Number 1", "WS2023", "100");
            createTimetrackWithoutPauseDuration("2024-01-22T13:00", "2024-01-23T13:00");
        });
        afterEach(() => {

            deleteSubject("Subject Number 1");
        });
        it("should change a number of timetracks if a timetrack is added", () => {

            checkNumberOfTimetracks(1);
            deleteTimetrackWithoutPauseDuration("22. Januar 2024 um 13:00.Lerndauer: 24 Stunden 0 Minuten .Dauer der Pause: 0 Minuten");
        });
        it("should change a progress percent if a timetrack is added", () => {

            checkProgressPercent(24);
            deleteTimetrackWithoutPauseDuration("22. Januar 2024 um 13:00.Lerndauer: 24 Stunden 0 Minuten .Dauer der Pause: 0 Minuten");
        });
        it("progress percent should be actual after adding second timetrack", () => {
            createTimetrackWithoutPauseDuration("2024-01-22T17:00", "2024-01-23T17:00");
            checkProgressPercent(48);
            deleteTimetrackWithoutPauseDuration("22. Januar 2024 um 13:00.Lerndauer: 24 Stunden 0 Minuten .Dauer der Pause: 0 Minuten");
            deleteTimetrackWithoutPauseDuration("22. Januar 2024 um 17:00.Lerndauer: 24 Stunden 0 Minuten .Dauer der Pause: 0 Minuten");
        });
        it("progress percent should be actual after deleting second timetrack", () => {
            createTimetrackWithoutPauseDuration("2024-01-22T17:00", "2024-01-23T17:00");
            deleteTimetrackWithoutPauseDuration("22. Januar 2024 um 13:00.Lerndauer: 24 Stunden 0 Minuten .Dauer der Pause: 0 Minuten");
            checkProgressPercent(48);
            deleteTimetrackWithoutPauseDuration("22. Januar 2024 um 17:00.Lerndauer: 24 Stunden 0 Minuten .Dauer der Pause: 0 Minuten");
        });


    });


    describe("editing a timetrack", () => {
        beforeEach(() => {
            createAndEnterSubject("Subject Number 1", "WS2023", "100");
            createTimetrackWithoutPauseDuration("2024-01-22T13:00", "2024-01-23T13:00");
            editTimetrackWithoutPauseDuration("2024-01-22T13:00", "2024-01-23T14:00");
        });

        afterEach(() => {
            deleteSubject("Subject Number 1");
        });

        it("should change a date of timetrack after editing timetrack", () => {

            cy.get(".global-list-element-name-button").should("contain.text", "22. Januar 2024 um 13:00.Lerndauer: 25 Stunden 0 Minuten .Dauer der Pause: 0 Minuten");


        });
        it("should change progress if study time after editing gets longer", () => {
            checkProgressPercent(25);
        });
        it("the number of timetracks should be the same after editing timetrack", () => {
                checkNumberOfTimetracks(1);
            }
        );

    });

});