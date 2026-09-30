# Academy Frontend Specification

## Purpose

Provide responsive role-aware academy portal experiences while treating server authorization as authoritative.

## Requirements

### Requirement: Academy session client behavior

The frontend MUST retain only the opaque academy bearer token in browser session storage and MUST NOT retain passwords, hashes, or legacy administrator credentials. It MUST add `Authorization: Bearer <token>` to academy API requests. On authentication failure, the frontend MUST clear the token and redirect to academy access. Frontend guards and redirects SHALL improve navigation but MUST NOT be the sole authorization control.

#### Scenario: Expired session returns user to access

- GIVEN a browser holds an academy token whose server session has expired or been revoked
- WHEN an academy API request fails authentication
- THEN the frontend MUST clear the token and redirect the user to `/academia/acceso`

### Requirement: Login, forced-password-change, and role routes

The frontend MUST offer a shared login page at `/academia/acceso` for parents and administrators. A session requiring password change MUST show the password-change flow and MUST not allow navigation to private content until it completes. Authenticated parents SHALL use `/academia`; authenticated administrators SHALL land at `/academia/admin/publicaciones`. Academy routes MUST replace the obsolete `/admin` and `/admin/leads` routes, with no compatibility redirect required.

#### Scenario: Temporary password requires change before portal navigation

- GIVEN a parent signs in using a temporary password
- WHEN the login response indicates `mustChangePassword`
- THEN the frontend MUST present password change and MUST not show the publication feed until the change succeeds

#### Scenario: Parent is redirected away from administration

- GIVEN an authenticated parent attempts to open `/academia/admin/publicaciones`
- WHEN the route is evaluated
- THEN the frontend MUST redirect the parent to the appropriate parent portal route while the server continues to enforce administrator authorization

### Requirement: Parent portal experience

The parent portal MUST provide a responsive narrow-width-capable publication feed with newest-first cards, title search, category selector including All, pagination, detail navigation, dates, safely rendered content, and authenticated attachment preview/download actions. The interface MUST not display author identity, hidden/deleted records, or lead-panel layout dependencies.

#### Scenario: Parent uses feed controls at narrow width

- GIVEN an authenticated parent uses a narrow viewport
- WHEN the parent searches, selects a category, and pages through publications
- THEN the interface MUST keep those controls and resulting publication navigation usable without relying on the former desktop lead panel

### Requirement: Administrator portal experience

The administrator portal MUST provide responsive navigation to publications at `/academia/admin/publicaciones` and users at `/academia/admin/usuarios`. It MUST support publication/category/attachment management, inspection of hidden and deleted publications, separate visual and source Markdown modes with preview, and user search/filter/pagination with one-time temporary-password presentation and clear lifecycle-conflict messaging. Administrator UUIDs MAY be displayed as subtle read-only metadata.

#### Scenario: Admin receives one-time reset password presentation

- GIVEN an administrator resets a user's password
- WHEN the reset response succeeds
- THEN the frontend MUST present the returned temporary password for that response flow and MUST not attempt to recover it from later list or detail responses

### Requirement: Public academy navigation and enrolment continuity

The public top menu MUST show **Acceso academia** to anonymous visitors. For an authenticated user, it MUST show a username menu with portal navigation and logout. The Google Forms enrolment call to action MUST remain available to public visitors.

#### Scenario: Authenticated user can leave the portal

- GIVEN an authenticated academy user opens the public top menu
- WHEN the user selects logout
- THEN the frontend MUST end the academy session client state and present anonymous navigation including **Acceso academia**
