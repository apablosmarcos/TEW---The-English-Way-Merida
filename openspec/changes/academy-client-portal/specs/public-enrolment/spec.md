# Public Enrolment Specification

## Purpose

Preserve the public academy enrolment journey while removing obsolete in-repository lead intake behavior.

## Requirements

### Requirement: Google Forms enrolment continuity

The public site MUST retain its Google Forms enrolment call to action. Public enrolment MUST NOT require academy authentication or use an in-repository lead submission API.

#### Scenario: Visitor starts enrolment

- GIVEN an anonymous public-site visitor wants to enrol
- WHEN the visitor selects the enrolment call to action
- THEN the site MUST continue the Google Forms journey without creating a lead through the application

### Requirement: Inert legacy lead preservation

The application MUST stop creating, importing into, querying, or otherwise actively using legacy lead data. Existing historic lead rows MAY remain physically preserved for controlled archival or recovery needs and MUST NOT be exposed through an active public or administrator lead feature.

#### Scenario: Historic lead row remains inert

- GIVEN an existing database contains historic lead data
- WHEN the academy application initializes and serves requests
- THEN it MUST leave that row physically intact and MUST not query it for enrolment, administration, or authentication
