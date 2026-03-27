/// <reference types="cypress" />

describe('Invox Fullstack App', () => {
  it('should load the authentication page', () => {
    cy.visit('http://localhost:3000/login');
    cy.get('h1').contains('Invox Login');
  });
});
