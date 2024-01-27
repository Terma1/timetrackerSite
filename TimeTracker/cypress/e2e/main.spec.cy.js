function createSubject(name, semester, time) {
    cy.visit('/html/main.html');
    cy.get("button").contains("+").click();
    cy.get("#add-subject-popup-form-input-subject-name").type(`Subject Number 1`);
    cy.get("#add-subject-popup-form-input-subject-semester").type(`WS2023`);
    cy.get("#add-subject-popup-form-input-required-hours").type(`100`);
    cy.get("button").contains("Speichern").click();

}

function deleteSubject(name) {
    cy.get(".menu-buttons").contains("Veranstaltungen").click();
    cy.contains(".global-list-element-name-button", name).parent(".global-list-element-container").within(() => {
        cy.get("button").contains("Löschen").click();
    });
    cy.get("#delete-subject-popup-form-confirm-button").contains("Ja").click();
}

describe("template spec", () => {
    it("should check header", () => {
        cy.visit('/html/main.html')

        cy.get("h1").should("contain.text", "Zeiterfassung-App");
    });

    describe("adding subjects", () => {
        beforeEach(() => {
            createSubject("Subject Number 1", "WS2023", "100");
        });
        afterEach(() => {
            deleteSubject("Subject Number 1");
        });
        it("subjects name should be correct after adding a new subject", () => {
            cy.get(".global-list-element-name-button").should("contain.text", "Subject Number 1");
        });
        it("subject should have a green check after its actual study time is equal or greater than expected time", () => {
            cy.get(".global-list-element-name-button").contains("Subject Number 1").click();
            cy.get("#add-timetrack-button").contains("+").click();
            cy.get("#start-date-add-popup").type("2024-01-22T13:00");
            cy.get("#end-date-add-popup").type("2024-01-28T13:00");
            cy.get("button").contains("Speichern").click();
            cy.get(".menu-buttons").contains("Veranstaltungen").click();
            cy.contains(".global-list-element-name-button", "Subject Number 1").should("contain.text", "✅");
        });
        it("subject should not have a green check when its actual study time is lesser than expected time", () => {
            cy.get(".global-list-element-name-button").contains("Subject Number 1").click();
            cy.get("#add-timetrack-button").contains("+").click();
            cy.get("#start-date-add-popup").type("2024-01-22T13:00");
            cy.get("#end-date-add-popup").type("2024-01-23T13:00");
            cy.get("button").contains("Speichern").click();
            cy.get(".menu-buttons").contains("Veranstaltungen").click();
            cy.contains(".global-list-element-name-button", "Subject Number 1")
                .should("not.contain.text", "✅");
        });
    });
    it("should translate headers name when language is changed to english", () => {
        cy.visit('/html/main.html')
        cy.get("#select-english-language").click({force: true});
        cy.get("h1").should("contain.text", "Time Tracker");
        cy.get("#select-german-language").click({force: true});
    });
    it("should translate menu buttons when language is changed to english", () => {
        cy.visit('/html/main.html')
        cy.get("#select-english-language").click({force: true});
        cy.get(".menu-buttons").should("contain.text", "Subjects");
        cy.get("#select-german-language").click({force: true});
    });
    it("should translate headers name when language is changed to russian", () => {
        cy.visit('/html/main.html')
        cy.get("#select-russian-language").click({force: true});
        cy.get("h1").should("contain.text", "Тайм трекер");
        cy.get("#select-german-language").click({force: true});
    });
    it("should translate menu buttons when language is changed to russian", () => {
        cy.visit('/html/main.html')
        cy.get("#select-russian-language").click({force: true});
        cy.get(".menu-buttons").should("contain.text", "Предметы");
        cy.get("#select-german-language").click({force: true});
    });


});
