# OAuth 2.0 (3LO) Apps

> Source: Atlassian Developer Documentation

## Overview

OAuth 2.0 (3LO) involves three parties:

- An Atlassian site (resource)
- A user (resource owner)
- An external application/service (client)

## Enabling OAuth 2.0 (3LO)

1. Go to developer.atlassian.com > Developer console
2. Select your app (or create one)
3. Select **Authorization** in the left menu
4. Next to OAuth 2.0 (3LO), select **Configure**
5. Enter the **Callback URL** (must match `redirect_uri`)
6. Click **Save changes**
7. Add APIs under **Permissions** in the left menu

## Implementation

### 1. Authorization URL

```
https://auth.atlassian.com/authorize?
  audience=api.atlassian.com&
  client_id=YOUR_CLIENT_ID&
  scope=REQUESTED_SCOPE_ONE%20REQUESTED_SCOPE_TWO&
  redirect_uri=https://YOUR_APP_CALLBACK_URL&
  state=YOUR_USER_BOUND_VALUE&
  response_type=code&
  prompt=consent
```

**Parameters:**
- `audience`: (required) `api.atlassian.com`
- `client_id`: (required) From developer console Settings
- `scope`: (required) Space-separated scopes. Only scopes already added in developer console.
- `redirect_uri`: (required) Must match callback URL in developer console
- `state`: (required) CSRF protection value bound to user session
- `response_type`: (required) `code`
- `prompt`: (required) `consent`

On success, user is redirected to callback URL with `code` query parameter.

### 2. Exchange Code for Access Token

```bash
curl --request POST \
  --url 'https://auth.atlassian.com/oauth/token' \
  --header 'Content-Type: application/json' \
  --data '{
    "grant_type": "authorization_code",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "code": "YOUR_AUTHORIZATION_CODE",
    "redirect_uri": "https://YOUR_APP_CALLBACK_URL"
  }'
```

**Success response:**
```json
{
  "access_token": "<string>",
  "expires_in": "<expiry time in seconds>",
  "scope": "<string>"
}
```

### 3. Making API Calls

#### 3.1 Get Cloud ID

```bash
curl --request GET \
  --url https://api.atlassian.com/oauth/token/accessible-resources \
  --header 'Authorization: Bearer ACCESS_TOKEN' \
  --header 'Accept: application/json'
```

**Example response (Jira):**
```json
[
  {
    "id": "1324a887-45db-1bf4-1e99-ef0ff456d421",
    "name": "Site name",
    "url": "https://your-domain.atlassian.net",
    "scopes": ["write:jira-work", "read:jira-user", "manage:jira-configuration"],
    "avatarUrl": "https://site-admin-avatar-cdn.prod.public.atl-paas.net/avatars/240/flag.png"
  }
]
```

#### 3.2 Request URL Structure

- **Jira:** `https://api.atlassian.com/ex/jira/{cloudid}/{api}`
- **Confluence:** `https://api.atlassian.com/ex/confluence/{cloudid}/{api}`

Example: `https://api.atlassian.com/ex/jira/11223344-a1b2-3b33-c444-def123456789/rest/api/3/issue/DEMO-1`

#### 3.3 Call the API

```bash
curl --request GET \
  --url https://api.atlassian.com/ex/jira/{cloudid}/rest/api/3/project \
  --header 'Authorization: Bearer ACCESS_TOKEN' \
  --header 'Accept: application/json'
```

### 4. Check Site Access

Call `GET https://api.atlassian.com/oauth/token/accessible-resources` with the access token. Returns array of sites the app has access to, with their scopes.

A grant can change when:
- The user revokes the grant
- The user consents to a new grant (new scopes override existing)

## Refresh Tokens

### Configuration

| Term | Default | Description |
|------|---------|-------------|
| Inactivity expiry time | 90 days | Token expires if user is inactive for this period |
| Reuse interval (leeway) | 10 minutes | Window where breach detection doesn't apply for multiple exchanges |

### Getting a Refresh Token

Add `offline_access` to the `scope` parameter of the authorization URL.

### Exchanging a Refresh Token

```bash
curl --request POST \
  --url 'https://auth.atlassian.com/oauth/token' \
  --header 'Content-Type: application/json' \
  --data '{
    "grant_type": "refresh_token",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

**Success response:**
```json
{
  "access_token": "<string>",
  "refresh_token": "<string>",
  "expires_in": "<expiry time in seconds>",
  "scope": "<string>"
}
```

**Important:** Each refresh returns a NEW refresh token. The old one is invalidated. Always store the latest refresh token.

### Error: `403 Forbidden` with `invalid_grant`

Possible causes:
- User's Atlassian account password changed
- Refresh token expired (90 days inactivity)
- App not replacing old refresh token with new one

## User Identity API

Add `read:me` scope to authorization URL.

```bash
curl --request GET \
  --url https://api.atlassian.com/me \
  --header 'Authorization: Bearer ACCESS_TOKEN' \
  --header 'Accept: application/json'
```

**Example response:**
```json
{
  "account_type": "atlassian",
  "account_id": "112233aa-bb11-cc22-33dd-445566abcabc",
  "email": "mia@example.com",
  "name": "Mia Krystof",
  "picture": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/...",
  "account_status": "active",
  "nickname": "mkrystof",
  "zoneinfo": "Australia/Sydney",
  "locale": "en-US",
  "extended_profile": {
    "job_title": "Designer",
    "organization": "mia@example.com",
    "department": "Design team",
    "location": "Sydney"
  }
}
```

## Jira REST API v3

### Authentication for OAuth 2.0 (3LO) Apps

URL structure: `https://api.atlassian.com/ex/jira/<cloudId>/rest/api/3/<resource-name>`

### Key Concepts

#### Expansion

Use `expand` query parameter to include optional fields:
```
GET issue/JRACLOUD-34423?expand=names,renderedFields
```

#### Pagination

Paginated responses:
```json
{
  "startAt": 0,
  "maxResults": 10,
  "total": 200,
  "isLast": false,
  "values": [...]
}
```

#### Ordering

- `?orderBy=name` — ascending (default)
- `?orderBy=+name` — ascending
- `?orderBy=-name` — descending

#### Special Headers

- `X-Atlassian-Token: no-check` — required for multipart/form-data requests (CSRF protection)
- `X-Force-Accept-Language: true` — use Accept-Language header for response language
- `X-AAccountId` — response header with authenticated user's account ID

#### Timestamps

Top-level timestamps returned in ISO 8601 format in system default timezone. Use `renderedFields` expand for user timezone.

## Known Issues

- **Implicit grant flow not supported** — only authorization code flow
- **Grant limitations** — account-level grants; user must repeat installation for multiple sites; admins can't revoke user access (only uninstall app)
- **Entity properties not searchable** — Jira apps using 3LO can't declare searchable entity properties (can't use in JQL)

## CORS

CORS whitelisting is supported for `api.atlassian.com`, enabling browser-based XHR/fetch requests.
