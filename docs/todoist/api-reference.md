# Todoist API v1 Reference

> Source: https://todoist.com/api/v1/docs (captured reference)

## Developing with Todoist

Thanks for your interest in developing apps with Todoist. In this section we will provide an overview of the API we offer and cover some common topics for application development using them.

You can use our API for free, but depending on your Todoist account plan (or that of the authenticated user), some features may be restricted.

Please consider subscribing to the Todoist API mailing list to get important updates.

### Our API

Our API uses an approach that should be familiar to anyone with experience calling RESTful APIs.

We also have a special endpoint called `/sync`, which is used by our first-party clients to keep the data updated locally without having to make many separate requests to the API. Anyone can use it, and some actions will only be available via `/sync`. The format is unconventional compared to current API standards, but it is our main driver for first-party apps.

### Our SDKs

Our Python and JavaScript SDKs streamline working with the Todoist API, and can be installed from the main package registries for each ecosystem.

For instructions, examples, and reference documentation, visit their pages:

- Todoist Python SDK
- Todoist TypeScript SDK

### Our MCP server

Our official MCP server makes it easier to connect AI assistants and other MCP clients to your tasks and projects via the Model Context Protocol.

Point your client to `https://ai.todoist.net/mcp` to get started.

Visit the full documentation in the Todoist AI MCP docs.

### Integrations

Integrations can be created and updated here.

Once done, they can also be submitted for evaluation and inclusion in our official integrations list. This not only serves as an opportunity to market your integration to our audience, but will also serve as a way to help users get set up and familiar with your app quickly.

To get your integration evaluated, please submit it via this page.

Lost? Reach out to us anytime.

## Authorization

An authenticated request with authorization header:

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d sync_token='*' \
    -d resource_types='["all"]'
```

In order to make authorized calls to the Sync API, your application must provide an authorization header with the appropriate `Bearer $token`. For working through the examples, you can obtain your personal API token from the integrations settings for your account.

To authenticate other users, your application will need to obtain a token from them using the OAuth protocol. For information on how to obtain a token from our service using OAuth, please see the authorization guide.

For the sake of simplicity the token is not listed on every parameter table but please note that the token parameter is required for every resource.

### OAuth

OAuth is also available for token generation. It's especially useful for external applications to obtain a user authorized API token via the OAuth2 protocol. Before getting started, developers need to create their applications in the App Management Console and configure one or more valid OAuth2 redirect URLs. A registered Todoist application is assigned a unique Client ID and Client Secret which are needed for the OAuth2 flow.

This procedure is comprised of 3 steps.

#### Step 1: Authorization request

An example of the URL to the authorization endpoint:

```
https://app.todoist.com/oauth/authorize?client_id=0123456789abcdef&scope=data:read,data:delete&state=secretstring
```

Redirect users to the authorization URL at the endpoint `https://app.todoist.com/oauth/authorize`, with the specified request parameters.

**Required parameters**

| Name | Description |
| --- | --- |
| client_id | The unique Client ID of the Todoist application that you registered. |
| scope | A comma separated list of permissions that you would like the users to grant to your application. See the below table for detail on the available scopes. |
| state | A unique and unguessable string. It is used to protect you against cross-site request forgery attacks. |

**Optional parameters**

| Name | Description |
| --- | --- |
| redirect_uri | The redirect URL for your application. If your application has multiple redirect URIs configured, this parameter is required — the request will be rejected with `invalid_request` if it is omitted. |

**Permission scopes**

| Name | Description |
| --- | --- |
| task:add | Grants permission to add new tasks (the application cannot read or modify any existing data). |
| data:read | Grants read-only access to application data, including tasks, projects, labels, and filters. |
| data:read_write | Grants read and write access to application data, including tasks, projects, labels, and filters. This scope includes `task:add` and `data:read` scopes. |
| data:delete | Grants permission to delete application data, including tasks, labels, and filters. |
| project:delete | Grants permission to delete projects. |
| backups:read | Grants permission to list backups bypassing MFA requirements. |

**Potential errors**

| Error | Description |
| --- | --- |
| User Rejected Authorization Request | When the user denies your authorization request, Todoist will redirect the user to the configured redirect URI with the error parameter: `http://example.com?error=access_denied`. |
| Redirect URI Not Configured | This JSON error will be returned to the requester (your user's browser) if redirect URI is not configured in the App Management Console. |
| Invalid Application Status | When your application exceeds the maximum token limit or when your application is being suspended due to abuse, Todoist will redirect the user to the configured redirect URI with the error parameter: `http://example.com?error=invalid_application_status`. |
| Invalid Scope | When the `scope` parameter is invalid, Todoist will redirect the user to the configured redirect URI with error parameter: `http://example.com?error=invalid_scope`. |

#### Step 2: Redirection to your application site

When the user grants your authorization request, the user will be redirected to the redirect URL configured for your application. The redirect request will come with two query parameters attached: `code` and `state`.

The `code` parameter contains the authorization code that you will use to exchange for an access token. The `state` parameter should match the `state` parameter that you supplied in the previous step. If the `state` is unmatched, your request has been compromised by other parties, and the process should be aborted.

#### Step 3: Token exchange

An example of exchanging the token:

```bash
$ curl "https://api.todoist.com/oauth/access_token" \
    -d "client_id=0123456789abcdef" \
    -d "client_secret=secret" \
    -d "code=abcdef" \
    -d "redirect_uri=https://example.com"
```

On success, Todoist returns HTTP 200 with token in JSON object format:

```json
{
    "access_token": "0123456789abcdef0123456789abcdef01234567",
    "token_type": "Bearer"
}
```

Once you have the authorization code, you can exchange it for the access token by sending a POST request to the following endpoint:

`https://api.todoist.com/oauth/access_token`.

**Required parameters**

| Name | Description |
| --- | --- |
| client_id | The Client ID of the Todoist application that you registered. |
| client_secret | The Client Secret of the Todoist application that you registered. |
| code | The code that was sent in the query string to the redirect URL in the previous step. |

**Potential errors**

| Error | Description |
| --- | --- |
| Bad Authorization Code Error | Occurs when the `code` parameter does not match the code that is given in the redirect request: `{"error": "bad_authorization_code"}` |
| Incorrect Client Credentials Error | Occurs when the `client_id` or `client_secret` parameters are incorrect: `{"error": "incorrect_application_credentials"}` |

### Cross Origin Resource Sharing

CORS headers example:

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -H "Origin: http://example.com"

HTTP/1.1 200 OK
Access-Control-Allow-Credentials: false
Access-Control-Allow-Origin: *
```

All API endpoints not related to the initial OAuth2 flow support Cross Origin Resource Sharing (CORS) for requests from any origin. The header `Access-Control-Allow-Origin: *` is set for successfully authenticated requests.

### Migrate Personal Token

Tokens obtained via the old email/password authentication method can be migrated to the new OAuth access token. Migrating your users' personal tokens will allow users to see your app in their Todoist Settings page and give them the ability to manage their app authorization.

A successful response has 200 OK status and `application/json` Content-Type.

**Request Body schema:** `application/json` (required)

- `client_id` (required) string — The unique Client ID of the Todoist application that you registered
- `client_secret` (required) string — The unique Client Secret of the Todoist application that you registered
- `personal_token` (required) string — Token obtained from the email/password authentication
- `scope` (required) string — Scopes of the OAuth token. Please refer to the Authorization guide for the detailed list of available scopes.

**Responses:** 200 / 400 / 401 / 403 / 404

`POST /api/v1/access_tokens/migrate_personal_token`

Request example:

```json
{
  "client_id": "string",
  "client_secret": "string",
  "personal_token": "string",
  "scope": "string"
}
```

Response example (200):

```json
{
  "access_token": "0123456789abcdef0123456789abcdef01234567",
  "token_type": "Bearer",
  "expires_in": 0
}
```

### Revoke Access Token Api

Revoke the access tokens obtained via OAuth.

**Query parameters**

- `client_id` (required) string
- `client_secret` (required) string
- `access_token` (required) string

`DELETE /api/v1/access_tokens`

Response example (200):

```json
null
```

### Revoke Token RFC 7009 Compliant

Revoke an access token according to RFC 7009 OAuth Token Revocation.

This endpoint accepts form-encoded data and follows the OAuth 2.0 Token Revocation specification. The client must authenticate using HTTP Basic authentication with their client credentials.

Authentication is performed via the Authorization header with the format: `Authorization: Basic base64(client_id:client_secret)`

**Request Body schema:** `application/json` (required)

- `token` (required) string — The token to be revoked (access token)
- `token_type_hint` (optional) string — A hint about the type of the token being revoked. Expected value: `'access_token'`

`POST /api/v1/revoke`

Request example:

```json
{
  "token": "string",
  "token_type_hint": "access_token"
}
```

Response example (200):

```json
null
```

## Todoist MCP

Integrate AI assistants with Todoist using the Model Context Protocol (MCP), an open standard for secure access to your tasks and projects. Our hosted MCP server works with Claude, ChatGPT, Cursor, and VS Code.

- Easy setup: OAuth in a minute.
- Full access: Read, create, and update your tasks & projects.
- Use cases: Daily reviews, project planning, natural-language queries.

### Setup guide

Primary URL (Streamable HTTP): `https://ai.todoist.net/mcp`

#### Claude

1. Open Settings → Connectors → Add custom connector.
2. Enter `https://ai.todoist.net/mcp` and complete OAuth.

#### Cursor

Create `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project):

```json
{
  "mcpServers": {
    "todoist": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://ai.todoist.net/mcp"]
    }
  }
}
```

Then enable the server in Cursor settings if prompted.

#### Claude Code (CLI)

```bash
claude mcp add --transport http todoist https://ai.todoist.net/mcp
```

#### Visual Studio Code

Command Palette → MCP: Add Server → Type HTTP and use:

```json
{
  "servers": {
    "todoist": {
      "type": "http",
      "url": "https://ai.todoist.net/mcp"
    }
  }
}
```

#### Other Clients

```bash
npx -y mcp-remote https://ai.todoist.net/mcp
```

## Sync

The Todoist Sync endpoint is specially designed for efficient data sync between clients (e.g. our mobile apps) and Todoist.

Sync requests should be made in HTTP POST (`application/x-www-form-urlencoded`). Sync responses, including errors, will be returned in JSON.

The Sync endpoint supports the following features:

- **Batching**: reading and writing of multiple resources can be done in a single HTTP request. Batch requests help clients reduce the number of network calls needed to sync resources.
- **Incremental sync**: You only retrieve data that is updated since the last time you performed a sync request.

Refer to Request Limits to learn more about the number of requests/commands you have for the Sync API.

### Overview

#### Read resources

Example read resources request:

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d sync_token='*' \
    -d resource_types='["all"]'
```

Example response:

```json
{
  "completed_info": [],
  "collaborators": [],
  "collaborator_states": [],
  "day_orders": {},
  "filters": [],
  "full_sync": true,
  "items": [],
  "labels": [],
  "live_notifications": [],
  "live_notifications_last_read_id": "0",
  "locations": [],
  "notes": [],
  "project_notes": [],
  "projects": [],
  "project_view_options_defaults": [],
  "reminders": [],
  "role_actions": {},
  "sections": [],
  "stats": {},
  "settings_notifications": {},
  "sync_token": "TnYUZEpuzf2FMA9qzyY3j4xky6dXiYejmSO85S5paZ_a9y1FI85mBbIWZGpW",
  "temp_id_mapping": {},
  "user": {},
  "user_plan_limits": {},
  "user_settings": {},
  "view_options": [],
  "workspace_users": {}
}
```

To retrieve your user resources, make a Sync API request with the following parameters:

**Parameters**

| Parameter | Required | Description |
| --- | --- | --- |
| `sync_token` String | Yes | A special string, used to allow the client to perform incremental sync. Pass `*` to retrieve all active resource data. More details about this below. |
| `resource_types` JSON array of strings | Yes | Used to specify what resources to fetch from the server. It should be a JSON-encoded array of strings. Here is a list of available resource types: `labels`, `projects`, `items`, `notes`, `sections`, `filters`, `reminders`, `reminders_location`, `locations`, `user`, `live_notifications`, `collaborators`, `user_settings`, `notification_settings`, `user_plan_limits`, `completed_info`, `stats`, `workspaces`, `workspace_users`, `workspace_filters`, `view_options`, `project_view_options_defaults`, `role_actions`. You may use `all` to include all the resource types. Resources can also be excluded by prefixing a `-` prior to the name, for example, `-projects`. |

In order to fetch both types of reminders you must include both resource types in your request, for example: `resource_types=["reminders", "reminders_location"]`.

The `workspace_users` resource type will not be returned in full sync, but should be requested in incremental sync to keep data up-to-date once it's loaded from the REST endpoint.

**Response**

When the request succeeds, an HTTP 200 response will be returned with a JSON object containing the requested resources and a new `sync_token`.

| Field | Description |
| --- | --- |
| sync_token | A new synchronization token. Used by the client in the next sync request to perform an incremental sync. |
| full_sync | Whether the response contains all data (a full synchronization) or just the incremental updates since the last sync. |
| full_sync_date_utc | For full syncs, the time when the data was generated. For big accounts, the data may be returned with some delay, requiring an incremental sync to get up-to-date data. |
| user | A user object. |
| projects | An array of project objects. |
| items | An array of item objects. |
| notes | An array of task comments objects. |
| project_notes | An array of project comments objects. |
| sections | An array of section objects. |
| labels | An array of personal label objects. |
| filters | An array of filter objects. |
| workspace_filters | An array of workspace filter objects. |
| day_orders | A JSON object specifying the order of items in daily agenda. |
| reminders | An array of reminder objects. |
| collaborators | A JSON object containing all collaborators for all shared projects. |
| collaborators_states | An array specifying the state of each collaborator in each project. |
| completed_info | An array of completed info objects. |
| live_notifications | An array of live_notification objects. |
| live_notifications_last_read | What is the last live notification the user has seen? |
| user_settings | A JSON object containing user settings. |
| user_plan_limits | A JSON object containing user plan limits. |
| stats | A JSON object containing user productivity stats. |
| view_options | An array of view options objects. |
| project_view_options_defaults | An array of project view options defaults objects. |
| role_actions | The actions each role in the system are allowed to perform on a project. |
| workspaces | A JSON object containing workspace objects. |
| workspace_users | A JSON object containing workspace_user objects. Only in incremental sync. |

#### Write resources

Example create project request:

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "project_add",
        "temp_id": "381e601f-0ef3-4ed6-bf95-58f896d1a314",
        "uuid": "ed1ce597-e4c7-4a88-ba48-e048d827c067",
        "args": {
            "name": "Shopping List",
            "color": "berry_red"
        }
    }]'
```

Example response:

```json
{
  "sync_token": "cdTUEvJoChiaMysD7vJ14UnhN-FRdP-IS3aisOUpl3aGlIQA9qosBgvMmhbn",
  "sync_status": {"ed1ce597-e4c7-4a88-ba48-e048d827c067": "ok"},
  "temp_id_mapping": {"381e601f-0ef3-4ed6-bf95-58f896d1a314": "6HWcc9PJCvPjCxC9"}
}
```

To write to your user's Todoist resources, make a Sync API request with the following parameters:

**Parameters**

| Parameter | Required | Description |
| --- | --- | --- |
| `commands` JSON | Yes | A JSON array of Command objects. Each command will be processed in the specified order. |

**Command object**

| Field | Description |
| --- | --- |
| `type` String | The type of the command. |
| `args` Object | The parameters of the command. |
| `uuid` String | Command UUID. More details about this below. |
| `temp_id` String | Temporary resource ID, Optional. Only specified for commands that create a new resource (e.g. `item_add` command). More details about this below. |

**Command UUID**

Clients should generate a unique string ID for each command and specify it in the `uuid` field. The Command UUID will be used for two purposes:

1. **Command result mapping**: Each command's result will be stored in the `sync_status` field of the response JSON object. The `sync_status` object has its key mapped to a command's `uuid` and its value containing the result of a command.
2. **Command idempotency**: Todoist will not execute a command that has same UUID as a previously executed command. This will allow clients to safely retry each command without accidentally performing the action twice.

**Temporary resource ID**

An example that shows how temporary IDs can be used and referenced:

```json
[
    {
        "type": "project_add",
        "temp_id": "c7beb07f-b226-4eb1-bf63-30d782b07b1a",
        "args": {
            "name": "Shopping List"
        },
        "uuid": "ac417051-1cdc-4dc3-b4f8-14526d5bfd16"
    },
    {
        "type": "item_add",
        "temp_id": "43f7ed23-a038-46b5-b2c9-4abda9097ffa",
        "args": {
            "content": "Buy Milk",
            "project_id": "c7beb07f-b226-4eb1-bf63-30d782b07b1a"
        },
        "uuid": "849fff4e-8551-4abb-bd2a-838d092775d7"
    }
]
```

You can see that the `project_add` command specified a `temp_id` property (`c7beb07f-b226-4eb1-bf63-30d782b07b1a`) as placeholder of the actual `project_id`. The `item_add` command can reference to this temporary project ID. The API will automatically resolve these IDs.

Some commands depend on the result of previous command. For instance, you have a command sequence: `project_add` and `item_add` which first creates a project and then add a new task to the newly created project. In order to run the later `item_add` command, we need to obtain the project ID returned from the previous command. Therefore, the normal approach would be to run these two commands in two separate HTTP requests.

The temporary resource ID feature allows you to run two or more dependent commands in a single HTTP request. For commands that are related to creation of resources (i.e. `item_add`, `project_add`), you can specify an extra `temp_id` as a placeholder for the actual ID of the resource. The other commands in the same sequence could directly refer to `temp_id` if needed.

#### Response / Error

An example of a single request sync return value:

```json
{
    "sync_status": { "863aca2c-65b4-480a-90ae-af160129abbd": "ok" }
}
```

An example of a multiple requests sync return value:

```json
{
    "sync_status": {
        "32eaa699-e9d7-47ed-91ea-e58d475791f1": "ok",
        "bec5b356-3cc1-462a-9887-fe145e3e1ebf": {
            "error_code": 15,
            "error": "Invalid temporary id"
        }
    }
}
```

An example of an error with additional context in `error_extra`:

```json
{
    "sync_status": {
        "bec5b356-3cc1-462a-9887-fe145e3e1ebf": {
            "error_tag": "INVALID_ARGUMENT_VALUE",
            "error_code": 20,
            "error": "Invalid argument value",
            "http_code": 400,
            "error_extra": {
                "argument": "file_url",
                "explanation": "file_url contains disallowed URL"
            }
        }
    }
}
```

The error object may contain the following fields:

| Field | Description |
| --- | --- |
| `error_tag` String | A machine-readable error identifier (e.g., `INVALID_ARGUMENT_VALUE`). |
| `error_code` Integer | A numeric error code. |
| `error` String | A human-readable error message. |
| `http_code` Integer | The HTTP status code associated with this error. |
| `error_extra` Object | Additional context about the error. Contents vary by error type; common fields are documented below. |

Common fields in `error_extra`:

| Field | Description |
| --- | --- |
| `argument` String | The name of the argument that caused the error. |
| `explanation` String | A detailed error description, included when it provides more context than the generic error message. |
| `retry_after` Integer | Seconds to wait before retrying (for rate-limited requests). |
| `workspace_id` Integer | The workspace ID related to the error. |
| `max_count` Integer | The limit that was exceeded (for limit-related errors). |
| `event_id` String | An event ID for error tracking/support purposes. |
| `project_id` String | The project ID related to the error. |
| `section_id` String | The section ID related to the error. |
| `bad_item` Object | Information about the item that caused the error. |

The result of command executions will be stored in the following response JSON object field:

| Data | Description |
| --- | --- |
| `temp_id_mapping` Object | A dictionary object that maps temporary resource IDs to real resource IDs. |
| `sync_status` Object | A dictionary object containing result of each command execution. The key will be the command's `uuid` field and the value will be the result status of the command execution. |

The status result of each command execution is in the `sync_status` dictionary object. The key is a command `uuid` and the value will be the result status of the command execution.

There are two possible values for each command status:

- An "ok" string which signals success of the command
- An error object containing error information of a command.

Please see the adjacent code examples for the possible format of the `sync_status`.

#### Response status codes

The server uses the HTTP status codes to indicate the success or failure of a request. As is customary in web servers, a 2xx code indicates success, a 4xx code an error due to incorrect user provided information, and a 5xx code an internal, possibly temporary, error.

| Status code | Description |
| --- | --- |
| 200 OK | The request was processed successfully. |
| 400 Bad Request | The request was incorrect. |
| 401 Unauthorized | Authentication is required, and has failed, or has not yet been provided. |
| 403 Forbidden | The request was valid, but for something that is forbidden. |
| 404 Not Found | The requested resource could not be found. |
| 429 Too Many Requests | The user has sent too many requests in a given amount of time. |
| 500 Internal Server Error | The request failed due to a server error. |
| 503 Service Unavailable | The server is currently unable to handle the request. |

#### Batching commands

Example of batching multiple commands:

```bash
curl https://api.todoist.com/api/v1/sync \
  -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
  -d commands='[
  {
    "type": "project_add",
    "temp_id": "0a57a3db-2ff1-4d2d-adf6-12490c13c712",
    "uuid": "2c0f6e03-c372-46ba-8e85-d94af56abcf3",
    "args": { "name": "Shopping List" }
  },
  {
    "type": "item_add",
    "temp_id": "ef3d840e-84c9-4433-9a32-86ae9a1e7d42",
    "uuid": "49ede211-12f3-42e9-8345-4c0d2b29c08d",
    "args": { "content": "Buy Milk", "project_id": "0a57a3db-2ff1-4d2d-adf6-12490c13c712" }
  },
  {
    "type": "item_add",
    "temp_id": "8a23c8cb-1d76-469d-a2c0-80a28b3ea6f6",
    "uuid": "46619250-ae02-4ab0-bd31-3c9ab0307e53",
    "args": { "content": "Buy Coffee", "project_id": "0a57a3db-2ff1-4d2d-adf6-12490c13c712" }
  },
  {
    "type": "item_add",
    "temp_id": "bf087eaf-aea9-4cb1-ab57-85188a2d428f",
    "uuid": "d0a1666b-d615-4250-aac5-65c7ea89091a",
    "args": { "content": "Buy Sugar", "project_id": "0a57a3db-2ff1-4d2d-adf6-12490c13c712" }
  }]'
```

Example response:

```json
{
  "sync_status": {
    "2c0f6e03-c372-46ba-8e85-d94af56abcf3": "ok",
    "49ede211-12f3-42e9-8345-4c0d2b29c08d": "ok",
    "d0a1666b-d615-4250-aac5-65c7ea89091a": "ok",
    "46619250-ae02-4ab0-bd31-3c9ab0307e53": "ok"
  },
  "temp_id_mapping": {
    "8a23c8cb-1d76-469d-a2c0-80a28b3ea6f6": "6X6HrfVQvQq5WCXH",
    "0a57a3db-2ff1-4d2d-adf6-12490c13c712": "6X6HrhXfQ9857XVG",
    "bf087eaf-aea9-4cb1-ab57-85188a2d428f": "6X6HrjHFgc3jQM8H",
    "ef3d840e-84c9-4433-9a32-86ae9a1e7d42": "6X6HrmjgW88crvMC"
  },
  "full_sync": true,
  "sync_token": "GSg4kDBAKWU7TZA_a-gcuSpxmO1lXT5bhLqUGd1F-AH69_qKEdkN_fJoBq3c"
}
```

When working with the Sync API, changes can be batched into one commit. In our example, we're batching the creation of a 'Shopping List' project with three different items.

As we've committed the changes all at once, we're significantly reducing the amount of network calls that have to be made, as well as ensuring we're not running into any rate limiting issues.

#### Incremental sync

The Sync API allows clients to retrieve only updated resources, and this is done by using the `sync_token` in your Sync API request.

On your initial sync request, specify `sync_token=*` in your request, and all the user's active resource data will be returned. The server will also return a new `sync_token` in the Sync API response.

In your subsequent Sync request, use the `sync_token` that you received from your previous sync response, and the Todoist API server will return only the updated resource data.

#### Full sync data delay

For big accounts, the data in the initial sync may be returned with some delay, and newer objects and updates may seem to be missing. The `full_sync_date_utc` attribute should be the same or very close to the current UTC date. If you notice a bigger time difference, it's recommended to do an incremental sync using the `sync_token` included in that initial sync response to get the latest updates.

## Workspace

An example workspace object:

```json
{
  "created_at": "2024-10-19T10:00:00.123456Z",
  "creator_id": "123",
  "current_active_projects": 5,
  "current_member_count": 2,
  "current_template_count": 0,
  "description": "Workspace description",
  "desktop_workspace_modal": null,
  "domain_discovery": false,
  "domain_name": null,
  "id": "1234",
  "invite_code": "ptoh4SICUu4",
  "is_collapsed": false,
  "is_deleted": false,
  "is_guest_allowed": true,
  "is_link_sharing_enabled": true,
  "is_trial_pending": false,
  "limits": {
    "current": {
      "admin_tools": false,
      "advanced_permissions": false,
      "automatic_backups": false,
      "calendar_layout": false,
      "durations": false,
      "max_collaborators": 250,
      "max_folders_per_workspace": 1000,
      "max_guests_per_workspace": 1000,
      "max_projects": 5,
      "max_workspace_templates": 100,
      "max_workspace_users": 1000,
      "max_workspaces": 50,
      "plan_name": "teams_workspaces_starter",
      "reminders": false,
      "reminders_at_due": true,
      "security_controls": false,
      "team_activity": true,
      "team_activity_plus": false,
      "upload_limit_mb": 5
    },
    "next": {
      "admin_tools": true,
      "advanced_permissions": true,
      "automatic_backups": true,
      "max_collaborators": 250,
      "max_guests_per_workspace": 1000,
      "max_projects": 1000,
      "max_workspace_users": 1000,
      "plan_name": "teams_workspaces_business",
      "reminders": true,
      "security_controls": true,
      "upload_limit_mb": 100
    }
  },
  "logo_big": "https://...",
  "logo_medium": "https://...",
  "logo_s640": "https://...",
  "logo_small": "https://...",
  "member_count_by_type": {
    "admin_count": 2,
    "guest_count": 0,
    "member_count": 0
  },
  "name": "Workspace name",
  "pending_invitations": [
    "pending@doist.com"
  ],
  "pending_invites_by_type": {
    "admin_count": 1,
    "guest_count": 0,
    "member_count": 0
  },
  "plan": "STARTER",
  "properties": {},
  "restrict_email_domains": false,
  "role": "MEMBER"
}
```

### Properties

| Property | Description |
| --- | --- |
| `id` String | The ID of the workspace. |
| `name` String | The name of the workspace (up to 255 characters). |
| `description` String | The description of the workspace. |
| `plan` String | The subscription plan this workspace is currently on, either `STARTER` or `BUSINESS`. |
| `is_link_sharing_enabled` Boolean | True if users are allowed to join the workspace using an invitation link. Default value is True. For guests, this field will be set to null as guests are not allowed to have access to this field. |
| `is_guest_allowed` Boolean | True if users from outside the workspace are allowed to join or be invited to workspace projects. Default value is True. |
| `invite_code` String | The invitation code used to generate an invitation link. If `is_link_sharing_enabled` is True, anyone can join the workspace using this code. For guests, this field will be set to null. |
| `role` String | The role of the requesting user in this workspace. Possible values are: `ADMIN`, `MEMBER` or `GUEST`. |
| `logo_big` String | The URL for the big workspace logo image. |
| `logo_medium` String | The URL for the medium workspace logo image. |
| `logo_small` String | The URL for the small workspace logo image. |
| `logo_s640` String | The URL for the square 640px workspace logo image. |
| `limits` Object | A list of restrictions for the workspace based on its current plan. |
| `creator_id` String | The ID of the user who created the workspace. |
| `created_at` String | The date when the workspace was created. |
| `is_deleted` Boolean | True if it is a deleted workspace. |
| `is_collapsed` Boolean | True if the workspace is collapsed. This is a user-specific attribute. |
| `domain_name` String | The domain name of the workspace. |
| `domain_discovery` Boolean | True if users with e-mail addresses in the workspace domain can join the workspace without an invitation. |
| `restrict_email_domains` Boolean | True if only users with e-mail addresses in the workspace domain can join the workspace. |
| `properties` Object | Configuration properties for the workspace. See Workspace Properties below. |
| `default_collaborators` Object | Default collaborators that are automatically added to new projects in this workspace. Contains `user_ids` and `predefined_group_ids`. |
| `desktop_workspace_modal` String | Enum value indicating when desktop should show workspace modal. Currently only supports `TRIAL_OFFER`. |

### Workspace Properties

The `properties` object contains configuration settings for the workspace:

| Property | Type | Description |
| --- | --- | --- |
| industry | String | The industry of the workspace. Possible values include: `agriculture`, `arts_entertainment`, `automotive`, `banking_financial_services`, `construction`, `consulting`, `consumer_goods`, `education`, `energy_utilities`, `food_beverages`, `government_public_sector`, `healthcare_life_sciences`, `information_technology`, `insurance`, `legal_services`, `manufacturing`, `media_communications`, `non_profit`, `pharmaceuticals`, `real_estate`, `retail_wholesale`, `telecommunications`, `transportation_logistics`, `travel_hospitality`, `other`. |
| department | String | The department of the workspace. |
| organization_size | String | The size of the organization. |
| creator_role | String | The role of the workspace creator: `owner_founder`, `leader`, `individual_contributor`. |
| region | String | 2 digit continent code: `AF`, `AS`, `EU`, `NA`, `SA`, `OC`, `AN`. |
| country | String | 2 digit ISO 3166-1 alpha-2 country code. |
| default_access_level | String | Default access level for new projects: `restricted`, `team` (default). |
| beta_enabled | Boolean | Indicates whether beta features are enabled for this workspace. Default `false`. |
| acquisition_source | String | The marketing channel or source that led to workspace creation. |
| hdyhau | String | How did you hear about us — marketing attribution field. |

### Add a workspace

Example add workspace request:

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "workspace_add",
        "temp_id": "4ff1e388-5ca6-453a-b0e8-662ebf373b6b",
        "uuid": "32774db9-a1da-4550-8d9d-910372124fa4",
        "args": {
            "name": "Fellowship Workspace"
        }
    }]'
```

Example response:

```json
{
  "sync_status": {"32774db9-a1da-4550-8d9d-910372124fa4": "ok"},
  "temp_id_mapping": {"4ff1e388-5ca6-453a-b0e8-662ebf373b6b": "6X6WMG4rmqx6FXQ9"}
}
```

Add a new workspace.

**Command arguments**

| Argument | Required | Description |
| --- | --- | --- |
| `name` String | Yes | The name of the workspace. |
| `description` String | No | The description of the workspace (up to 1024 characters). |
| `is_link_sharing_enabled` Boolean | No | Indicates if users are allowed to join the workspace using an invitation link. Default `True`. |
| `is_guest_allowed` Boolean | No | Indicates if users from outside the workspace are allowed to join or be invited. Default `True`. |
| `domain_name` String | No | The domain name of the workspace. |
| `domain_discovery` Boolean | No | True if users with e-mail addresses in the workspace domain can join without an invitation. |
| `restrict_email_domains` Boolean | No | True if only users with e-mail addresses in the workspace domain can join. |
| `properties` Object | No | Configuration properties for the workspace. |
| `default_collaborators` Object | No | Default collaborators for new projects. |

### Update a workspace

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "workspace_update",
        "temp_id": "4ff1e388-5ca6-453a-b0e8-662ebf373b6b",
        "uuid": "32774db9-a1da-4550-8d9d-910372124fa4",
        "args": {
            "id": "12345",
            "description": "Where magic happens"
        }
    }]'
```

Update an existing workspace.

**Command arguments**

| Argument | Required | Description |
| --- | --- | --- |
| `id` String | Yes | Real or temp ID of the workspace |
| `name` String | No | The name of the workspace. |
| `description` String | No | The description of the workspace (up to 1024 characters). |
| `is_collapsed` Boolean | No | The collapsed state of the workspace for the current user. |
| `is_link_sharing_enabled` Boolean | No | Indicates if users are allowed to join via invitation link. |
| `is_guest_allowed` Boolean | No | Indicates if users from outside the workspace are allowed to join. Default `True`. |
| `invite_code` String | No | Regenerate the invite_code for the workspace. Any non-empty string regenerates a new code. |
| `domain_name` String | No | The domain name of the workspace. |
| `domain_discovery` Boolean | No | True if users with matching domain emails can join without an invitation. |
| `restrict_email_domains` Boolean | No | True if only users with matching domain emails can join. |
| `properties` Object | No | Configuration properties for the workspace. |
| `default_collaborators` Object | No | Default collaborators for new projects. |

### Leave a workspace

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "workspace_leave",
        "temp_id": "4ff1e388-5ca6-453a-b0e8-662ebf373b6b",
        "uuid": "32774db9-a1da-4550-8d9d-910372124fa4",
        "args": {
            "id": "6X6WMMqgq2PWxjCX"
        }
    }]'
```

Remove self from a workspace. The user is also removed from any workspace project previously joined.

**Command arguments**

| Argument | Required | Description |
| --- | --- | --- |
| `id` String | Yes | Real or temp ID of the workspace |

All `workspace_users` can leave a workspace by themselves.

### Delete a workspace

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "workspace_delete",
        "temp_id": "4ff1e388-5ca6-453a-b0e8-662ebf373b6b",
        "uuid": "32774db9-a1da-4550-8d9d-910372124fa4",
        "args": {
            "id": "6X6WMRPC43g2gHVx"
        }
    }]'
```

Delete an existing workspace. This command is only usable by workspace admins.

**Command arguments**

| Argument | Required | Description |
| --- | --- | --- |
| `id` String | Yes | The ID of the workspace |

## Workspace users

`workspace_users` are not returned in full sync responses, only in incremental sync. To keep a list of workspace users up-to-date, clients should first list all workspace users, then use incremental sync.

`workspace_users` are not the same as `collaborators`. Two users can be members of a common workspace without having a common shared project, so they will both "see" each other in `workspace_users` but not in `collaborators`.

Guests will not receive `workspace_users` sync events or resources.

An example `workspace_users` object:

```json
{
    "user_id": "1855581",
    "workspace_id": "424876",
    "user_email": "you@example.com",
    "full_name": "Example User",
    "timezone": "GMT +3:00",
    "avatar_big": "https://*.cloudfront.net/*_big.jpg",
    "avatar_medium": "https://*.cloudfront.net/*_medium.jpg",
    "avatar_s640": "https://*.cloudfront.net/*_s640.jpg",
    "avatar_small": "https://*.cloudfront.net/*_small.jpg",
    "image_id": "d160009dfd52b991030d55227003450f",
    "role": "MEMBER",
    "is_deleted": false
}
```

### Properties

| Property | Description |
| --- | --- |
| `user_id` String | The user ID. |
| `workspace_id` String | The workspace ID for this user. |
| `user_email` String | The user email. |
| `full_name` String | The full name of the user. |
| `timezone` String | The timezone of the user. |
| `image_id` String | The ID of the user's avatar. |
| `role` String | The role of the user in this workspace. Possible values: `ADMIN`, `MEMBER`, `GUEST`. |
| `avatar_big` String | The link to a 195x195 pixels image of the user's avatar. |
| `avatar_medium` String | The link to a 60x60 pixels image. |
| `avatar_s640` String | The link to a 640x640 pixels image. |
| `avatar_small` String | The link to a 35x35 pixels image. |
| `is_deleted` Boolean | Whether the workspace user is marked as deleted. |

Avatar URLs are only available if the user has an avatar (when `image_id` is not null).

### Change user role

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "workspace_update_user",
        "temp_id": "4ff1e388-5ca6-453a-b0e8-662ebf373b6b",
        "uuid": "32774db9-a1da-4550-8d9d-910372124fa4",
        "args": {
            "workspace_id": "12345",
            "user_email": "user@acme.com",
            "role": "ADMIN"
        }
    }]'
```

Change the role of a workspace user. Admins or members cannot be downgraded to guests. Only usable by workspace admins.

**Command arguments**

| Argument | Required | Description |
| --- | --- | --- |
| `id` String | Yes | Real or temp ID of the workspace |
| `user_email` String | Yes | The new member's email |
| `role` String | Yes | The role to be assigned. Valid values: `GUEST`, `MEMBER`, `ADMIN`. |

### Update user sidebar preference

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "workspace_update_user_sidebar_preference",
        "temp_id": "4ff1e388-5ca6-453a-b0e8-662ebf373b6b",
        "uuid": "32774db9-a1da-4550-8d9d-910372124fa4",
        "args": {
            "workspace_id": "12345",
            "sidebar_preference": "A_TO_Z"
        }
    }]'
```

Update the sidebar preference for the requesting user in a workspace.

**Command arguments**

| Argument | Required | Description |
| --- | --- | --- |
| `workspace_id` String | Yes | Real or temp ID of the workspace |
| `sidebar_preference` String | Yes | The sidebar preference. Valid values: `MANUAL`, `A_TO_Z`, `Z_TO_A`. |

### Delete workspace user

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "workspace_delete_user",
        "temp_id": "4ff1e388-5ca6-453a-b0e8-662ebf373b6b",
        "uuid": "32774db9-a1da-4550-8d9d-910372124fa4",
        "args": {
            "workspace_id": "12345",
            "user_email": "user@acme.com"
        }
    }]'
```

Remove a user from a workspace. Only usable by workspace admins.

**Command arguments**

| Argument | Required | Description |
| --- | --- | --- |
| `id` String | Yes | Real or temp ID of the workspace |
| `user_email` String | Yes | The email of the member to be deleted |

### Invite Users to a Workspace

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
      {
        "type": "workspace_invite",
        "uuid": "32774db9-a1da-4550-8d9d-910372124fa4",
        "args": {
            "id": "6Jf8VQXxpwv56VQ7",
            "email_list": ["foo@example.com", "bar@example.com"],
            "role": "MEMBER"
        }
      }]
    '
```

Creates workspace invitations for a list of email addresses.

**Command arguments**

| Argument | Required | Description |
| --- | --- | --- |
| `id` String | Yes | ID of the workspace. |
| `email_list` List of String | Yes | A list of emails to be invited to the workspace. |
| `role` String | No | The role the user will be given. Possible values: `ADMIN`, `MEMBER`, `GUEST`. |

### Resend a Workspace Invitation

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
      {
        "type": "workspace_resend_invite",
        "uuid": "32774db9-a1da-4550-8d9d-910372124fa4",
        "args": {
            "id": "6Jf8VQXxpwv56VQ7",
            "email": "bar@example.com"
        }
      }]
    '
```

Re-send the workspace invitation email for an existing pending invitation. Only workspace admins may use this command. Guest invitations cannot be resent via this command.

**Command arguments**

| Argument | Required | Description |
| --- | --- | --- |
| `id` String | Yes | ID of the workspace the pending invitation belongs to. |
| `email` String | Yes | Email address of the pending invitee whose invite should be resent. |

## View Options

An example view option object:

```json
{
    "view_type": "project",
    "object_id": "6Jf8VQXxpwv56VQ7",
    "filtered_by": "!assigned",
    "grouped_by": "priority",
    "sorted_by": "added_date",
    "sort_order": "asc",
    "show_completed_tasks": false,
    "view_mode": "calendar",
    "calendar_settings": { "layout": "month" },
    "is_deleted": false,
    "deadline": "no deadline"
}
```

### Properties

| Property | Description |
| --- | --- |
| `view_type` Enum | The type of a view customization. `today`, `upcoming`, `project`, `label`, `filter` or `workspace_filter`. |
| `object_id` String | The ID of the object referred to by `view_type`, when applicable. |
| `filtered_by` String | A search query for this view customization. |
| `grouped_by` Enum | Grouping criteria. One of `assignee`, `added_date`, `due_date`, `deadline`, `label`, `priority`, `project`, or `workspace`. |
| `sorted_by` Enum | Sorting criteria. One of `alphabetically`, `assignee`, `added_date`, `due_date`, `deadline`, `label`, `priority`, `project`, `workspace`, or `manual`. |
| `sort_order` Enum | `asc` or `desc`. |
| `show_completed_tasks` Boolean | Whether completed tasks should be shown automatically. |
| `view_mode` Enum | `list`, `board`, or `calendar`. Note: ignored in projects, where `project.view_style` is used instead. |
| `deadline` String | Search query for deadline filtering. |
| `calendar_settings` JSON | Settings for the calendar when `view_mode` is `calendar`. Currently only `{"layout": "week"}` and `{"layout": "month"}` are supported. |
| `is_deleted` Boolean | Whether the view option is marked as deleted. |

Note: `view_options.view_mode` is secondary to `project.view_style` for projects in Todoist clients. The former is set per user, while the latter is set per project.

### Set a view option

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "view_options_set",
        "uuid": "997d4b43-55f1-48a9-9e66-de5785dfd696",
        "args": {
            "view_type": "project",
            "object_id": "6Jf8VQXxpwv56VQ7",
            "view_mode": "board",
            "grouped_by": "assignee"
        }
    }]'
```

| Argument | Required | Description |
| --- | --- | --- |
| `view_type` Enum | Yes | Type of the view customization. |
| `object_id` String | Yes | ID of the object, required when `view_type` is `project`, `label`, `filter` or `workspace_filter`. |
| `filtered_by` String | No | Search query. |
| `grouped_by` Enum | No | Grouping criteria. |
| `sorted_by` Enum | No | Sorting criteria. |
| `sort_order` Enum | No | Sorting order. |
| `show_completed_tasks` Boolean | No | Whether completed tasks should be shown automatically. |
| `view_mode` Enum | No | The mode in which to render tasks. |
| `deadline` String | No | A search query for deadline filtering. |
| `calendar_settings` JSON | No | Calendar settings when `view_mode` is `calendar`. |

### Delete view option

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "view_options_delete",
        "uuid": "f8539c77-7fd7-4846-afad-3b201f0be8a6",
        "args": {
            "view_type": "today"
        }
    }]'
```

| Argument | Required | Description |
| --- | --- | --- |
| `view_type` Enum | Yes | Type of the view customization to delete. |
| `object_id` String | Yes | ID of the object, required when `view_type` is `project`, `label`, `filter` or `workspace_filter`. |

## Project View Options Defaults

Project View Options Defaults (PVODs) define the default view preferences for all users of a project. These settings serve as the baseline view configuration that applies to all project members unless they have their own personal view options set.

An example PVOD object:

```json
{
    "project_id": "2203306141",
    "view_mode": "list",
    "grouped_by": null,
    "sorted_by": "due_date",
    "sort_order": "asc",
    "show_completed_tasks": false,
    "filtered_by": null,
    "calendar_settings": null,
    "creator_uid": 1855589,
    "updater_uid": 1855589
}
```

### Properties

| Property | Description |
| --- | --- |
| `project_id` | The project ID these defaults apply to (string, required) |
| `view_mode` | The default view mode: `list`, `board`, or `calendar` (string, required) |
| `grouped_by` | How tasks are grouped: `due_date`, `created_at`, `label`, `assignee`, `priority`, or `project` (string or null) |
| `sorted_by` | How tasks are sorted: `due_date`, `created_at`, `task_order`, `assignee`, `alphabetically`, or `priority` (string or null) |
| `sort_order` | Sort direction: `asc` or `desc` (string, required) |
| `show_completed_tasks` | Whether to show completed tasks by default (boolean, required) |
| `filtered_by` | JSON string with filter criteria (string or null) |
| `calendar_settings` | Calendar-specific settings when `view_mode` is calendar (object or null) |
| `creator_uid` | User ID who created these defaults (integer, required) |
| `updater_uid` | User ID who last updated these defaults (integer, required) |

### Sync behavior

- PVODs are returned during full sync if the user has access to the project.
- When a project is created, its PVOD is automatically created and included in the same sync response.
- Updates to PVODs trigger sync events for all project members.
- When a PVOD is deleted, a tombstone is returned with `is_deleted: true`.
- PVODs take precedence over legacy `project.view_style` settings.

### Commands

#### `project_view_options_defaults_set`

Updates the default view options for a project. Only users with admin permissions on the project can update PVODs.

**Command arguments:**

| Name | Required | Description |
| --- | --- | --- |
| `project_id` | Yes | The project ID to update defaults for |
| `view_mode` | No | `list`, `board`, or `calendar` |
| `grouped_by` | No | How to group tasks |
| `sorted_by` | No | How to sort tasks |
| `sort_order` | No | `asc` or `desc` |
| `show_completed_tasks` | No | Whether to show completed tasks |
| `filtered_by` | No | JSON string with filter criteria |
| `calendar_settings` | No | Calendar-specific settings (required when `view_mode` is calendar) |

Example command:

```bash
$ curl -X POST \
    https://api.todoist.com/api/v1/sync \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d '[{
        "type": "project_view_options_defaults_set",
        "uuid": "bf0855a3-0138-44-b618-1cb8d3d7a869",
        "args": {
            "project_id": "2203306141",
            "view_mode": "board",
            "grouped_by": "priority",
            "sorted_by": "due_date",
            "sort_order": "asc",
            "show_completed_tasks": false
        }
    }]'
```

## User

An example user:

```json
{
    "activated_user": false,
    "auto_reminder": 0,
    "avatar_big": "https://*.cloudfront.net/*_big.jpg",
    "avatar_medium": "https://*.cloudfront.net/*_medium.jpg",
    "avatar_s640": "https://*.cloudfront.net/*_s640.jpg",
    "avatar_small": "https://*.cloudfront.net/*_small.jpg",
    "business_account_id": "1",
    "daily_goal": 15,
    "date_format": 0,
    "days_off": [6, 7],
    "email": "me@example.com",
    "feature_identifier": "2671355_0123456789abcdef70123456789abcdefe0123456789abcdefd0123456789abc",
    "features": {
        "beta": 1,
        "dateist_inline_disabled": false,
        "dateist_lang": null,
        "global.teams": true,
        "has_push_reminders": true,
        "karma_disabled": false,
        "karma_vacation": false,
        "kisa_consent_timestamp": null,
        "restriction": 3
    },
    "full_name": "Example User",
    "has_password": true,
    "id": "2671355",
    "image_id": "d160009dfd52b991030d55227003450f",
    "inbox_project_id": "6X7fqH39MwjmwV4q",
    "is_celebrations_enabled": true,
    "is_premium": true,
    "joinable_workspace": null,
    "joined_at": "2015-07-31T18:32:06.000000Z",
    "karma": 37504,
    "karma_trend": "up",
    "lang": "en",
    "mfa_enabled": false,
    "next_week": 1,
    "premium_status": "current_personal_plan",
    "premium_until": null,
    "share_limit": 51,
    "sort_order": 0,
    "start_day": 1,
    "start_page": "project?id=2203306141",
    "theme_id": "11",
    "time_format": 0,
    "token": "0123456789abcdef0123456789abcdef01234567",
    "urgent_reminder_device": {
        "device_platform": "ios",
        "device_id": "12345678",
        "device_token": "a1b2c3d4...",
        "device_name": "iPhone 15 Pro"
    },
    "tz_info": {
        "gmt_string": "-03:00",
        "hours": -3,
        "is_dst": 0,
        "minutes": 0,
        "timezone": "America/Sao_Paulo"
    },
    "verification_status": "legacy",
    "weekend_start_day": 6,
    "weekly_goal": 30
}
```

A Todoist user is represented by a JSON object. The dates will be in the UTC timezone.

### Properties

| Property | Description |
| --- | --- |
| `auto_reminder` Integer | The default time in minutes for the automatic reminders set, whenever a due date has been specified for a task. |
| `avatar_big` String | The link to a 195x195 pixels image of the user's avatar. |
| `avatar_medium` String | The link to a 60x60 pixels image. |
| `avatar_s640` String | The link to a 640x640 pixels image. |
| `avatar_small` String | The link to a 35x35 pixels image. |
| `business_account_id` String | The ID of the user's business account. |
| `daily_goal` Integer | The daily goal number of completed tasks for karma. |
| `date_format` Integer | Whether to use the DD-MM-YYYY date format (if set to 0), or the MM-DD-YYYY format (if set to 1). |
| `dateist_lang` String | The language expected for date recognition instead of the user's lang. |
| `days_off` Array | Array of integers representing user's days off (1=Monday, 7=Sunday). |
| `email` String | The user's email. |
| `feature_identifier` String | An opaque id used internally to handle features for the user. |
| `features` Object | Used internally for any special features that apply to the user. |
| `full_name` String | The user's real name formatted as `Firstname Lastname`. |
| `has_password` Boolean | Whether the user has a password set on the account. |
| `id` String | The user's ID. |
| `image_id` String | The ID of the user's avatar. |
| `inbox_project_id` String | The ID of the user's Inbox project. |
| `is_premium` Boolean | Whether the user has a Todoist Pro subscription. |
| `joined_at` String | The date when the user joined Todoist. |
| `karma` Integer | The user's karma score. |
| `karma_trend` String | The user's karma trend (for example `up`). |
| `lang` String | The user's language code. |
| `next_week` Integer | The day of the next week, that tasks will be postponed to. |
| `premium_status` String | Outlines why a user is premium: `not_premium`, `current_personal_plan`, `legacy_personal_plan` or `teams_business_member`. |
| `premium_until` String | The date when the user's Todoist Pro subscription ends. |
| `sort_order` Integer | Whether to show projects in oldest dates first order (0) or oldest dates last order (1). |
| `start_day` Integer | The first day of the week (1-7). |
| `start_page` String | The user's default view on Todoist. |
| `theme_id` String | The currently selected Todoist theme. |
| `time_format` Integer | 24h (0) or 12h (1) time format. |
| `token` String | The user's token to call other API methods. |
| `urgent_reminder_device` Object | The device designated to receive urgent reminder alarms. |
| `tz_info` Object | The user's timezone information. |
| `weekend_start_day` Integer | The day used when scheduling for the 'Weekend'. |
| `verification_status` String | `unverified`, `verified`, `blocked`, or `legacy`. |
| `weekly_goal` Integer | The target number of tasks to complete per week. |

### Update user's properties

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "user_update",
        "uuid": "52f83009-7e27-4b9f-9943-1c5e3d1e6889",
        "args": {
            "current_password": "fke4iorij",
            "email": "mynewemail@example.com"
        }
    }]'
```

**Command arguments**

| Argument | Required | Description |
| --- | --- | --- |
| `current_password` String | Yes (if modifying email or password) | The user's current password. |
| `email` String | No | The user's email. |
| `full_name` String | No | The user's name. |
| `password` String | No | The user's updated password (min 8 chars). |
| `timezone` String | No | The user's timezone. |
| `start_page` String | No | The user's default view. |
| `start_day` Integer | No | The first day of the week (1-7). |
| `next_week` Integer | No | Day of next week to postpone (1-7). |
| `time_format` Integer | No | 0 = 24h, 1 = 12h. |
| `date_format` Integer | No | 0 = DD-MM-YYYY, 1 = MM-DD-YYYY. |
| `sort_order` Integer | No | 0 = oldest first, 1 = oldest last. |
| `auto_reminder` Integer | No | Default reminder time in minutes. |
| `urgent_reminder_device` Object | No | Device for urgent reminder alarms. |
| `theme` Integer | No | Theme (0-10). |
| `weekend_start_day` Integer | No | Day used for 'Weekend' scheduling (1-7). |
| `beta` Boolean | No | Beta testing group membership. |

**Error codes**

| Error Tag | Description |
| --- | --- |
| `PASSWORD_REQUIRED` | Modify password/email without `current_password`. |
| `AUTHENTICATION_ERROR` | Wrong `current_password`. |
| `PASSWORD_TOO_SHORT` | < 8 characters. |
| `COMMON_PASSWORD` | Matches a common password list. |
| `PASSWORD_CONTAINS_EMAIL` | Password contains email/parts. |
| `INVALID_EMAIL` | Invalid email address. |
| `BAD_REQUEST` | Invalid `urgent_reminder_device`. |
| `ERROR_DEVICE_NOT_FOUND` | Device not registered. |

### Update karma goals

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "update_goals",
        "uuid": "b9bbeaf8-9db6-452a-a843-a192f1542892",
        "args": {"vacation_mode": 1}
    }]'
```

**Command arguments**

| Argument | Required | Description |
| --- | --- | --- |
| `daily_goal` Integer | No | The target number of tasks to complete per day. |
| `weekly_goal` Integer | No | The target number of tasks to complete per week. |
| `ignore_days` Integer | No | A list with the days of the week to ignore. |
| `vacation_mode` Integer | No | 1 = on vacation, 0 = off. |
| `karma_disabled` Integer | No | 1 = disabled, 0 = enabled. |

### User plan limits

The `user_plan_limits` sync resource describes the available features and limits applicable to the current user plan.

```json
{
    "user_plan_limits": {
        "current": {
            "plan_name": "free"
        },
        "next": {
            "plan_name": "pro"
        }
    }
}
```

| Property | Description |
| --- | --- |
| `current` Object | A user plan info object representing the available functionality and limits for the user's current plan. |
| `next` Object | A user plan info object representing the plan available for upgrade. Null if no upgrade. |

### User plan info

Example:

```json
{
    "activity_log": true,
    "activity_log_limit": 7,
    "advanced_permissions": true,
    "automatic_backups": false,
    "calendar_feeds": true,
    "calendar_layout": true,
    "comments": true,
    "completed_tasks": true,
    "custom_app_icon": false,
    "customization_color": false,
    "deadlines": true,
    "durations": true,
    "email_forwarding": true,
    "filters": true,
    "labels": true,
    "max_calendar_accounts": 1,
    "max_collaborators": 5,
    "max_filters": 3,
    "max_folders_per_workspace": 25,
    "max_workspace_filters": 3,
    "workspace_filters": true,
    "max_free_workspaces_created": 1,
    "max_guests_per_workspace": 25,
    "max_labels": 500,
    "max_projects": 5,
    "max_projects_joined": 500,
    "max_reminders_location": 300,
    "max_reminders_time": 700,
    "max_sections": 20,
    "max_tasks": 300,
    "max_user_templates": 100,
    "plan_name": "free",
    "reminders": false,
    "reminders_at_due": true,
    "templates": true,
    "upload_limit_mb": 5,
    "uploads": true,
    "weekly_trends": true
}
```

### User settings

Example:

```json
{
    "reminder_push": true,
    "reminder_desktop": true,
    "reminder_email": true,
    "completed_sound_desktop": true,
    "completed_sound_mobile": true
}
```

Availability of reminders functionality is dependent on the current user plan.

| Property | Description |
| --- | --- |
| `reminder_push` Boolean | Set to true to send reminders as push notifications. |
| `reminder_desktop` Boolean | Set to true to show reminders in desktop applications. |
| `reminder_email` Boolean | Set to true to send reminders by email. |
| `completed_sound_desktop` Boolean | Sound on completion in desktop. |
| `completed_sound_mobile` Boolean | Sound on completion in mobile. |

### User productivity stats

Example:

```json
{
  "completed_count": 123,
  "days_items": [
    {
      "date": "2025-10-17",
      "total_completed": 5
    }
  ],
  "week_items": [
    {
      "from": "2025-10-13",
      "to": "2025-10-19",
      "total_completed": 12
    }
  ]
}
```

### Update user settings

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "user_settings_update",
        "temp_id": "e24ad822-a0df-4b7d-840f-83a5424a484a",
        "uuid": "41e59a76-3430-4e44-92b9-09d114be0d49",
        "args": {"reminder_desktop": false}
    }]'
```

| Argument | Required | Description |
| --- | --- | --- |
| `reminder_push` Boolean | No | Send reminders as push notifications. |
| `reminder_desktop` Boolean | No | Show reminders in desktop applications. |
| `reminder_email` Boolean | No | Send reminders by email. |
| `completed_sound_desktop` Boolean | No | Enable completion sound on desktop. |
| `completed_sound_mobile` Boolean | No | Enable completion sound on mobile. |

## Sharing

Projects can be shared with other users (collaborators).

### Collaborators

```json
{
    "id": "2671362",
    "email": "you@example.com",
    "full_name": "Example User",
    "timezone": "GMT +3:00",
    "image_id": null
}
```

| Property | Description |
| --- | --- |
| `id` String | The user ID of the collaborator. |
| `email` String | The email of the collaborator. |
| `full_name` String | The full name of the collaborator. |
| `timezone` String | The timezone of the collaborator. |
| `image_id` String | The image ID for the collaborator's avatar. |

### Collaborator states

```json
{
    "project_id": "6H2c63wj7x9hFJfX",
    "user_id": "2671362",
    "state": "active",
    "is_deleted": false,
    "role": "READ_WRITE"
}
```

| Property | Description |
| --- | --- |
| `project_id` String | The shared project ID of the user. |
| `user_id` String | The user ID of the collaborator. |
| `state` String | `active` or `invited`. |
| `is_deleted` Boolean | True if the collaborator left the project. |
| `role` | The role of the collaborator. Only available for teams. |

### Share a project

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "share_project",
        "temp_id": "854be9cd-965f-4ddd-a07e-6a1d4a6e6f7a",
        "uuid": "fe6637e3-03ce-4236-a202-8b28de2c8372",
        "args": {
            "project_id": "6H2c63wj7x9hFJfX",
            "email": "you@example.com"
        }
    }]'
```

Workspace projects with `is_invite_only` set to true can only be shared by workspace admins, or by project members with `ADMIN` or `CREATOR` role.

| Argument | Required | Description |
| --- | --- | --- |
| `project_id` String | Yes | The project to be shared. |
| `email` String | Yes | The user email with whom to share the project. |
| `role` String | No | The role of the new collaborator. Only used for teams. |

### Delete a collaborator

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "delete_collaborator",
        "uuid": "0ae55ac0-3b8d-4835-b7c3-59ba30e73ae4",
        "args": {
            "project_id": "6H2c63wj7x9hFJfX",
            "email": "you@example.com"
        }
    }]'
```

In Teams, only workspace admins or project members with `ADMIN` or `CREATOR` role can delete a collaborator.

| Argument | Required | Description |
| --- | --- | --- |
| `project_id` String | Yes | The project to be affected. |
| `email` String | Yes | The user email with whom the project was shared. |

### Accept an invitation

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "accept_invitation",
        "uuid": "4b254da4-fa2b-4a88-9439-b27903a90f7f",
        "args": {
            "invitation_id": "1234",
            "invitation_secret": "abcdefghijklmno"
        }
    }]'
```

| Argument | Required | Description |
| --- | --- | --- |
| `invitation_id` String | Yes | The invitation ID. |
| `invitation_secret` String | Yes | The secret fetched from the live notification. |

### Reject an invitation

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "reject_invitation",
        "uuid": "284fd900-c36f-44e5-ab92-ee93455e50e0",
        "args": {
            "invitation_id": "1234",
            "invitation_secret": "abcdefghijklmno"
        }
    }]'
```

### Delete an invitation

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "delete_invitation",
        "uuid": "399f6a8d-ddea-4146-ae8e-b41fb8ff6945",
        "args": {"invitation_id": "1234"}
    }]'
```

| Argument | Required | Description |
| --- | --- | --- |
| `invitation_id` String | Yes | The invitation to be deleted. |

## Sections

An example section object:

```json
{
    "id": "6Jf8VQXxpwv56VQ7",
    "name": "Groceries",
    "project_id": "9Bw8VQXxpwv56ZY2",
    "section_order": 1,
    "is_collapsed": false,
    "user_id": "2671355",
    "is_deleted": false,
    "is_archived": false,
    "archived_at": null,
    "added_at": "2019-10-07T07:09:27.000000Z",
    "updated_at": "2019-10-07T07:09:27.000000Z"
}
```

### Properties

| Property | Description |
| --- | --- |
| `id` String | The ID of the section. |
| `name` String | The name of the section. |
| `project_id` String | Project that the section resides in. |
| `section_order` Integer | The order of the section. |
| `is_collapsed` Boolean | Whether the section's tasks are collapsed. |
| `sync_id` String | A special ID for shared sections. |
| `is_deleted` Boolean | Whether the section is marked as deleted. |
| `is_archived` Boolean | Whether the section is marked as archived. |
| `archived_at` String | The date when the section was archived. |
| `added_at` String | The date when the section was created. |
| `updated_at` String | The date when the section was updated. |

### Add a section

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[{
      "type": "section_add",
      "temp_id": "69ca86df-5ffe-4be4-9c3a-ad14fe98a58a",
      "uuid": "97b68ab2-f524-48da-8288-476a42cccf28",
      "args": {"name": "Groceries", "project_id": "9Bw8VQXxpwv56ZY2"}
    }]'
```

| Argument | Required | Description |
| --- | --- | --- |
| `name` String | Yes | The name of the section. |
| `project_id` String | Yes | The ID of the parent project. |
| `section_order` Integer | No | The order of the section. |

### Update a section

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[{
      "type": "section_update",
      "uuid": "afda2f29-319c-4d09-8162-f2975bed3124",
      "args": {"id": "6X7FxXvX84jHphx2", "name": "Supermarket"}
    }]'
```

| Argument | Required | Description |
| --- | --- | --- |
| `id` String | Yes | The ID of the section. |
| `name` String | No | The name of the section. |
| `is_collapsed` Boolean | No | Whether the section's tasks are collapsed. |

### Move a section

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[{
      "type": "section_move",
      "uuid": "a8583f66-5885-4729-9e55-462e72d685ff",
      "args": {"id": "6X7FxXvX84jHphx2", "project_id": "9Bw8VQXxpwv56ZY2"}
    }]'
```

| Argument | Required | Description |
| --- | --- | --- |
| `id` String | Yes | The ID of the section. |
| `project_id` String | No | ID of the destination project. |

### Reorder sections

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[{
      "type": "section_reorder",
      "uuid": "109af205-6ff7-47fa-a5f8-1f13e59744ef",
      "args": {
        "sections": [
          {"id": "6X7FxXvX84jHphx2", "section_order": 1},
          {"id": "6X9FxXvX64jjphx3", "section_order": 2}
        ]
      }
    }]'
```

### Delete a section

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[{
      "type": "section_delete",
      "uuid": "cebb5267-3e3c-40da-af44-500649281936",
      "args": {"id": "6X7FxXvX84jHphx2"}
    }]'
```

### Archive / Unarchive

```bash
# Archive
{"type": "section_archive", "uuid": "...", "args": {"id": "6X7FxXvX84jHphx2"}}

# Unarchive
{"type": "section_unarchive", "uuid": "...", "args": {"id": "6X7FxXvX84jHphx2"}}
```

## Reminders

An example reminder:

```json
{
  "id": "6X7Vfq5rqPMM5j5q",
  "notify_uid": "2671355",
  "item_id": "6RP2hmPwM3q4WGfW",
  "type": "absolute",
  "due": {
    "date": "2016-08-05T07:00:00.000000Z",
    "timezone": null,
    "is_recurring": false,
    "string": "tomorrow at 10:00",
    "lang": "en"
  },
  "minute_offset": 180,
  "is_deleted": false,
  "is_urgent": false
}
```

Availability of reminders functionality and the maximum number of stored reminders are dependent on the current user plan.

### Properties

| Property | Description |
| --- | --- |
| `id` String | The ID of the reminder. |
| `notify_uid` String | The user ID which should be notified. |
| `item_id` String | The item ID for which the reminder is about. |
| `type` String | `relative`, `absolute`, or `location`. |
| `due` Object | The due date of the reminder. |
| `minute_offset` Integer | Relative time in minutes before the due date. |
| `name` String | An alias name for the location. |
| `loc_lat` String | Location latitude. |
| `loc_long` String | Location longitude. |
| `loc_trigger` String | `on_enter` or `on_leave`. |
| `radius` Integer | Radius around the location (meters). |
| `is_deleted` Boolean | Marked as deleted. |
| `is_urgent` Boolean | Whether the reminder is an urgent reminder. |

### Add a reminder

Relative reminder:

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "reminder_add",
        "temp_id": "e24ad822-a0df-4b7d-840f-83a5424a484a",
        "uuid": "41e59a76-3430-4e44-92b9-09d114be0d49",
        "args": {
            "item_id": "6RP2hmPwM3q4WGfW",
            "minute_offset": 30,
            "type": "absolute"
        }
    }]'
```

Absolute reminder:

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "reminder_add",
        "temp_id": "952a365e-4965-4113-b4f4-80cdfcada172u",
        "uuid": "e7c8be2d-f484-4852-9422-a9984c58b1cd",
        "args": {
            "item_id": "6RP2hmPwM3q4WGfW",
            "due": {
                "date": "2014-10-15T11:00:00.000000Z"
            },
            "type": "absolute"
        }
    }]'
```

Location reminder:

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "reminder_add",
        "temp_id": "7ad9609d-579f-4828-95c5-3600acdb2c81",
        "uuid": "830cf409-daba-479c-a624-68eb0c07d01c",
        "args": {
            "item_id": "6RP2hmPwM3q4WGfW",
            "type": "location",
            "name": "Aliados",
            "loc_lat": "41.148581",
            "loc_long":"-8.610945000000015",
            "loc_trigger":"on_enter",
            "radius": 100
        }
    }]'
```

### Update / Delete a reminder

```bash
{"type": "reminder_update", "uuid": "...", "args": {"id": "6X7VrXrqjX6642cv", "due": {"date": "2014-10-10T15:00:00.000000"}}}
{"type": "reminder_delete", "uuid": "...", "args": {"id": "6X7VrXrqjX6642cv"}}
```

## Locations

Locations are a top-level entity. They contain a list of all locations that are used within the user's current location reminders.

An example location object (note: it's an ordered array):

```json
["Shibuya-ku, Japan", "35.6623001098633", "139.706527709961"]
```

| Array index | Description |
| --- | --- |
| 0 String | Name of the location. |
| 1 String | Location latitude. |
| 2 String | Location longitude. |

### Clear locations

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[{"type": "clear_locations", "uuid": "d285ae02-80c6-477c-bfa9-45272d7bddfb", "args": {}}]'
```

## Projects

An example project object:

```json
{
    "id": "6Jf8VQXxpwv56VQ7",
    "name": "Shopping List",
    "description": "Stuff to buy",
    "workspace_id": 12345,
    "is_invite_only": false,
    "status": "IN_PROGRESS",
    "is_link_sharing_enabled": true,
    "collaborator_role_default": "READ_WRITE",
    "color": "lime_green",
    "parent_id": null,
    "child_order": 1,
    "is_collapsed": false,
    "shared": false,
    "can_assign_tasks": false,
    "is_deleted": false,
    "is_archived": false,
    "is_favorite": false,
    "is_frozen": false,
    "view_style": "list",
    "role": "READ_WRITE",
    "inbox_project": true,
    "folder_id": null,
    "created_at": "2023-07-13T10:20:59Z",
    "updated_at": "2024-12-10T13:27:29Z",
    "is_pending_default_collaborator_invites": false
}
```

### Properties

| Property | Description |
| --- | --- |
| `id` String | The ID of the project. |
| `name` String | The name of the project. |
| `description` String | Description for the project. Only used for teams. |
| `workspace_id` String | Workspace ID. Only used for teams. |
| `is_invite_only` Boolean | Indicates if the project is invite-only. Only used for teams. |
| `status` String | Project status: `PLANNED`, `IN_PROGRESS`, `PAUSED`, `COMPLETED`, `CANCELED`. Only used for teams. |
| `is_link_sharing_enabled` Boolean | Visibility via link. Only used for teams. |
| `collaborator_role_default` String | Default role: `CREATOR`, `ADMIN`, `READ_WRITE`, `EDIT_ONLY`, `COMPLETE_ONLY`. Only used for teams. |
| `color` String | The color of the project icon. |
| `parent_id` String | The ID of the parent project. |
| `child_order` Integer | Position among siblings. |
| `is_collapsed` Boolean | Whether the project's sub-projects are collapsed. |
| `shared` Boolean | Whether the project is shared. |
| `can_assign_tasks` Boolean | Whether tasks in the project can be assigned. |
| `is_deleted` Boolean | Marked as deleted. |
| `is_archived` Boolean | Marked as archived. |
| `is_favorite` Boolean | Whether the project is a favorite. |
| `is_frozen` Boolean | Workspace or personal projects from a canceled subscription. |
| `view_style` Enum | `list`, `board`, or `calendar`. |
| `role` String | The role of the requesting user. Only used for teams. |
| `inbox_project` Boolean | Whether the project is Inbox. |
| `folder_id` String | The ID of the folder. |
| `created_at` String | Project creation date. |
| `updated_at` String | Project update date. |
| `is_pending_default_collaborator_invites` Boolean | If true, default collaborators are still being added. Only used for teams. |
| `access` Object | Project access configuration. Only used for teams. |
| `is_project_insights_enabled` Boolean | Whether Project Insights is enabled. Only used for teams. |

### Add a project

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands='[
    {
        "type": "project_add",
        "temp_id": "4ff1e388-5ca6-453a-b0e8-662ebf373b6b",
        "uuid": "32774db9-a1da-4550-8d9d-910372124fa4",
        "args": {
            "name": "Shopping List"
        }
    }]'
```

| Argument | Required | Description |
| --- | --- | --- |
| `name` String | Yes | The name of the project. |
| `color` String | No | The color of the project icon. |
| `parent_id` String | No | The ID of the parent project. |
| `folder_id` String | No | The ID of the folder, when creating projects in workspaces. |
| `child_order` Integer | No | Position among siblings. |
| `is_favorite` Boolean | No | Mark as favorite. |
| `view_style` String | No | `list` or `board` (default `list`). |
| `description` String | No | Description (teams only). |
| `workspace_id` String | No | Workspace ID (teams only). |
| `is_invite_only` Boolean | No | Invite-only flag (teams only). |
| `status` String | No | Status (teams only). |
| `is_link_sharing_enabled` Boolean | No | Link sharing (teams only). |
| `collaborator_role_default` String | No | Default role (teams only). |
| `access` Object | No | Project access configuration (teams only). |
| `is_project_insights_enabled` Boolean | No | Project Insights toggle (teams only). |

### Update a project

```bash
$ curl https://api.todoist.com/api/v1/sync \
    -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
    -d commands=[
    {
        "type": "project_update",
        "uuid": "1ca42128-d12f-4a66-8413-4d6ff2838fde",
        "args": {
            "id": "6Jf8VQXxpwv56VQ7",
            "name": "Shopping"
        }
    }]'
```

### Move a project

```bash
{
    "type": "project_move",
    "uuid": "1ca42128-d12f-4a66-8413-4d6ff2838fde",
    "args": {
        "id": "6Jf8VQXxpwv56VQ7",
        "parent_id": "6X7fphhgwcXVGccJ"
    }
}
```

### Move a Project to a Workspace

```bash
{
    "type": "project_move_to_workspace",
    "uuid": "1ca42128-d12f-4a66-8413-4d6ff2838fde",
    "args": {
        "project_id": "6Jf8VQXxpwv56VQ7",
        "workspace_id": "220325187",
        "is_invite_only": false,
        "folder_id": null
    }
}
```

When `use_lro=true` is passed, this command creates a Long Running Operation (LRO) and processes the move in the background.

**Deprecation notice:** The synchronous behavior (without `use_lro`) is deprecated and will be removed in a future version.

| Argument | Required | Description |
| --- | --- | --- |
| `project_id` String | Yes | The ID of the project. |
| `workspace_id` String | Yes | The destination workspace. |
| `is_invite_only` Boolean | No | Restricted access. |
| `folder_id` String | No | Folder destination. |
| `use_lro` Boolean | No | Process as LRO (recommended). |

### Move a Project out of a Workspace

```bash
{
    "type": "project_move_to_personal",
    "uuid": "1ca42128-d12f-4a66-8413-4d6ff2838fde",
    "args": {
        "project_id": "6Jf8VQXxpwv56VQ7"
    }
}
```

Only the original creator of the project has permissions to do this, and only if they are still currently an admin of the workspace.

### Leave a project (teams only)

```bash
{
    "type": "project_leave",
    "uuid": "1ca42128-d12f-4a66-8413-4d6ff2838fde",
    "args": {
        "project_id": "6Jf8VQXxpwv56VQ7"
    }
}
```

### Delete / Archive / Unarchive

```bash
{"type": "project_delete", "uuid": "...", "args": {"id": "6X7fphhgwcXVGccJ"}}
{"type": "project_archive", "uuid": "...", "args": {"id": "6X7fphhgwcXVGccJ"}}
{"type": "project_unarchive", "uuid": "...", "args": {"id": "6X7fphhgwcXVGccJ"}}
```

### Reorder projects

```bash
{
    "type": "project_reorder",
    "uuid": "bf0855a3-0138-4b76-b895-88cad8db9edc",
    "args": {
        "projects": [
            {"id": "6Jf8VQXxpwv56VQ7", "child_order": 1},
            {"id": "6X7fphhgwcXVGccJ", "child_order": 2}
        ]
    }
}
```

### Change project role

```bash
{
    "type": "project_change_role",
    "uuid": "bbec1a60-2bdd-48ac-a623-c8eb968e1697",
    "args": {
        "id": "6X7fphhgwcXVGccJ",
        "user_id": 12345678,
        "role": "EDIT_ONLY"
    }
}
```

| Argument | Required | Description |
| --- | --- | --- |
| `id` String | Yes | Project ID. |
| `user_id` Int | Yes | User to update. |
| `role` String | Yes | New role: `CREATOR`, `ADMIN`, `READ_WRITE`, `EDIT_ONLY`, `COMPLETE_ONLY`. |

## Comments

### Task comments

Example:

```json
{
    "id": "6X7gfQHG59V8CJJV",
    "posted_uid": "2671355",
    "item_id": "6X7gfV9G7rWm5hW8",
    "content": "Note",
    "file_attachment": {
        "file_type": "text/plain",
        "file_name": "File1.txt",
        "file_size": 1234,
        "file_url": "https://example.com/File1.txt",
        "upload_state": "completed"
    },
    "uids_to_notify": ["84129"],
    "is_deleted": false,
    "posted_at": "2014-10-01T14:54:55.000000Z",
    "reactions": { "❤️": ["2671362"], "👍": ["2671362", "2671366"] }
}
```

| Property | Description |
| --- | --- |
| `id` String | The ID of the note. |
| `posted_uid` String | The ID of the user that posted the note. |
| `item_id` String | The item which the note is part of. |
| `content` String | The content of the note (markdown supported). |
| `file_attachment` Object | A file attached to the note. |
| `uids_to_notify` Array of String | A list of user IDs to notify. |
| `is_deleted` Boolean | Marked as deleted. |
| `posted_at` String | The date when the note was posted. |
| `reactions` Object | List of emoji reactions and corresponding user IDs. |

#### Add / Update / Delete a task comment

```bash
{"type": "note_add", "temp_id": "...", "uuid": "...", "args": {"item_id": "6X7gfV9G7rWm5hW8", "content": "Note1"}}
{"type": "note_update", "uuid": "...", "args": {"id": "6X7gfQHG59V8CJJV", "content": "Updated Note1"}}
{"type": "note_delete", "uuid": "...", "args": {"id": "6X7hH7Gpwr3w7jX9"}}
```

### Project Comments

Example:

```json
{
    "content": "Hello 2",
    "id": "6X7hH9GWrqWhF69Q",
    "is_deleted": false,
    "posted_at": "2018-08-14T10:56:50.000000Z",
    "posted_uid": "2671355",
    "project_id": "6Jf8VQXxpwv56VQ7",
    "reactions": null,
    "uids_to_notify": ["2671362"],
    "file_attachment": {
        "file_type": "text/plain",
        "file_name": "File1.txt",
        "file_size": 1234,
        "file_url": "https://example.com/File1.txt",
        "upload_state": "completed"
    }
}
```

#### Add / Update / Delete a project comment

```bash
{"type": "note_add", "temp_id": "...", "uuid": "...", "args": {"project_id": "6Jf8VQXxpwv56VQ7", "content": "Note1"}}
{"type": "note_update", "uuid": "...", "args": {"id": "6X7hH9GWrqWhF69Q", "content": "Updated Note 1"}}
{"type": "note_delete", "uuid": "...", "args": {"id": "6X7hH9GWrqWhF69Q"}}
```

### File Attachments

A file attachment is represented as a JSON object. The file attachment may point to a document previously uploaded by the `uploads/add` API call, or by any external resource.

**Base file properties**

| Attribute | Description |
| --- | --- |
| `file_name` String | The name of the file. |
| `file_size` Integer | The size of the file in bytes. |
| `file_type` String | MIME type. |
| `file_url` String | The URL where the file is located. |
| `upload_state` String | `pending` or `completed`. |

**Image file properties**

| Attribute | Description |
| --- | --- |
| `tn_l` List | Large thumbnail. |
| `tn_m` List | Medium thumbnail. |
| `tn_s` List | Small thumbnail. |

Audio files may include `file_duration` (seconds, integer).

## Live notifications

### Types

| Type | Description |
| --- | --- |
| `share_invitation_sent` | Sent to the sharing invitation receiver. |
| `share_invitation_accepted` | Sent to the sharing invitation sender, when the receiver accepts. |
| `share_invitation_rejected` | Sent to the sharing invitation sender, when the receiver rejects. |
| `user_left_project` | Sent to everyone when somebody leaves the project. |
| `user_removed_from_project` | Sent to everyone when somebody is removed. |
| `item_assigned` | Sent to the user responsible for the task. |
| `item_completed` | Sent to the assigner when the task is completed. |
| `item_uncompleted` | Sent to the assigner when the task is uncompleted. |
| `note_added` | Sent to all members of the shared project when someone adds a note. |
| `workspace_invitation_created` | Sent to the invitee when invited to a workspace. |
| `workspace_invitation_accepted` | Sent to the inviter when accepted. |
| `workspace_invitation_rejected` | Sent to the inviter when declined. |
| `project_archived` | Sent to project collaborators when the project is archived. |
| `removed_from_workspace` | Sent to removed user when removed from a workspace. |
| `workspace_deleted` | Sent to every workspace admin/member/guest. |
| `teams_workspace_upgraded` | Sent when workspace is upgraded to paid plan. |
| `teams_workspace_canceled` | Sent when workspace returns to Starter plan. |
| `teams_workspace_payment_failed` | Sent to billing admin on payment failure. |
| `karma_level` | Sent when a new karma level is reached. |
| `share_invitation_blocked_by_project_limit` | Invitation blocked due to project limits. |
| `workspace_user_joined_by_domain` | When a user joins a workspace by domain. |

### Common properties

| Property | Description |
| --- | --- |
| `id` String | ID of the live notification. |
| `created_at` String | Creation date. |
| `from_uid` String | ID of initiator. |
| `notification_key` String | Unique notification key. |
| `notification_type` String | Type of notification. |
| `seq_no` Integer | Sequence number. |
| `is_unread` Boolean | Whether unread. |

### Set last known / Mark as read / unread / all read

```bash
{"type": "live_notifications_set_last_read", "uuid": "...", "args": {"id": "1234"}}
{"type": "live_notifications_mark_read", "uuid": "...", "args": {"ids": ["1234"]}}
{"type": "live_notifications_mark_read_all", "uuid": "..."}
{"type": "live_notifications_mark_unread", "uuid": "...", "args": {"ids": ["1234"]}}
```

## Labels

There are two types of labels: **personal** and **shared**.

- **Personal labels** are created by the current user, can be customized, and stay in the account unless deleted.
- **Shared labels** are created by collaborators on shared tasks. They appear gray by default and only persist while there are active tasks with that label.

A user can convert a shared label to a personal label at any time. Shared labels do not appear in the sync response — they only appear within the `labels` list of the tasks that they are assigned to.

### Properties (personal labels)

| Property | Description |
| --- | --- |
| `id` String | The ID of the label. |
| `name` String | The name of the label. |
| `color` String | The color of the label icon. |
| `item_order` Integer | Label's order in the label list. |
| `is_deleted` Boolean | Marked as deleted. |
| `is_favorite` Boolean | Marked as favorite. |

Example:

```json
{
    "id": "2156154810",
    "name": "Food",
    "color": "lime_green",
    "item_order": 0,
    "is_deleted": false,
    "is_favorite": false
}
```

### Add / Update / Delete a personal label

```bash
{"type": "label_add", "temp_id": "...", "uuid": "...", "args": {"name": "Food"}}
{"type": "label_update", "uuid": "...", "args": {"id": "2156154810", "color": "berry_red"}}
{"type": "label_delete", "uuid": "...", "args": {"id": "2156154810", "cascade": "all"}}
```

For `label_delete`, the `cascade` argument is `all` (default — also remove from all tasks) or `none` (remove from account but keep on tasks as shared label).

### Rename a shared label / Delete shared label occurrences

```bash
{"type": "label_rename", "uuid": "...", "args": {"name_old": "Food", "name_new": "Drink"}}
{"type": "label_delete_occurrences", "uuid": "...", "args": {"name": "Shopping"}}
```

### Update multiple label orders

```bash
{
    "type": "label_update_orders",
    "uuid": "...",
    "args": {"id_order_mapping": {"2156154810": 1, "2156154820": 2}}
}
```

## Tasks

An example task object:

```json
{
    "id": "6X7rM8997g3RQmvh",
    "user_id": "2671355",
    "project_id": "6Jf8VQXxpwv56VQ7",
    "content": "Buy Milk",
    "description": "",
    "priority": 1,
    "due": null,
    "deadline": null,
    "parent_id": null,
    "child_order": 1,
    "section_id": "3Ty8VQXxpwv28PK3",
    "day_order": -1,
    "is_collapsed": false,
    "labels": ["Food", "Shopping"],
    "added_by_uid": "2671355",
    "assigned_by_uid": "2671355",
    "responsible_uid": null,
    "checked": false,
    "is_deleted": false,
    "added_at": "2025-01-21T21:28:43.841504Z",
    "updated_at": "2025-01-21T21:28:43Z",
    "completed_at": null,
    "duration": {
        "amount": 15,
        "unit": "minute"
    }
}
```

### Properties

| Property | Description |
| --- | --- |
| `id` String | The ID of the task. |
| `user_id` String | The owner of the task. |
| `project_id` String | The ID of the parent project. |
| `content` String | The text of the task (markdown supported). |
| `description` String | A description for the task (markdown supported). |
| `due` Object | The due date of the task. See Due dates section. |
| `deadline` Object | The deadline of the task. See Deadlines section. |
| `priority` Integer | 1 to 4 (4 = very urgent on API; p1 in clients = 4 in API). |
| `parent_id` String | The ID of the parent task. |
| `child_order` Integer | Position among siblings. |
| `section_id` String | The ID of the parent section. |
| `day_order` Integer | Order in Today/Next 7 days view. |
| `is_collapsed` Boolean | Whether sub-tasks are collapsed. |
| `labels` Array of String | Task labels. |
| `added_by_uid` String | ID of the creating user. |
| `assigned_by_uid` String | ID of the user who assigned the task. |
| `responsible_uid` String | ID of the user responsible for the task. |
| `checked` Boolean | Whether the task is completed. |
| `is_deleted` Boolean | Marked as deleted. |
| `completed_at` String | Date when the task was completed. |
| `added_at` String | Datetime when created. |
| `updated_at` String | Datetime when updated. |
| `duration` Object | Task duration: `amount` (positive integer) and `unit` (`minute` or `day`). |

### Add a task

```bash
{
    "type": "item_add",
    "temp_id": "43f7ed23-a038-46b5-b2c9-4abda9097ffa",
    "uuid": "997d4b43-55f1-48a9-9e66-de5785dfd69b",
    "args": {
        "content": "Buy Milk",
        "project_id": "6Jf8VQXxpwv56VQ7",
        "labels": ["Food", "Shopping"]
    }
}
```

| Argument | Required | Description |
| --- | --- | --- |
| `content` String | Yes | Task text. |
| `description` String | No | Task description. |
| `project_id` String | No | Project. Defaults to Inbox. |
| `due` Object | No | Due date. |
| `deadline` Object | No | Deadline. |
| `priority` Integer | No | 1-4. |
| `parent_id` String | No | Parent task. |
| `child_order` Integer | No | Position. |
| `section_id` String | No | Section. |
| `day_order` Integer | No | Day order. |
| `is_collapsed` Boolean | No | Collapsed flag. |
| `labels` Array of String | No | Labels. |
| `assigned_by_uid` String | No | Assigner. |
| `responsible_uid` String | No | Responsible user. |
| `auto_reminder` Boolean | No | Add the default reminder if due date with time is set. |
| `auto_parse_labels` Boolean | No | Parse labels from content; create new ones if missing. |
| `duration` Object | No | Task duration. |

### Update a task

`item_update` does not handle parent changes, moves, completes, or uncompletes.

| Argument | Required | Description |
| --- | --- | --- |
| `id` String | Yes | Task ID. |
| `content` String | No | Task text. |
| `description` String | No | Task description. |
| `due` Object | No | Due date. |
| `deadline` Object | No | Deadline. |
| `priority` Integer | No | 1-4. |
| `is_collapsed` Boolean | No | Collapsed flag. |
| `labels` Array of String | No | Labels. |
| `assigned_by_uid` String | No | Assigner. |
| `responsible_uid` String | No | Responsible user. |
| `day_order` Integer | No | Day order. |
| `duration` Object | No | Task duration. |

### Move a task

Only one of `parent_id`, `section_id` or `project_id` must be set.

```bash
{
    "type": "item_move",
    "uuid": "...",
    "args": {"id": "6X7rM8997g3RQmvh", "parent_id": "6X7rf9x6pv2FGghW"}
}
```

### Reorder, Delete, Complete, Uncomplete, Close

```bash
{"type": "item_reorder", "uuid": "...", "args": {"items": [{"id": "...", "child_order": 1}]}}
{"type": "item_delete", "uuid": "...", "args": {"id": "6X7rfFVPjhvv84XG"}}
{"type": "item_complete", "uuid": "...", "args": {"id": "...", "date_completed": "2017-01-02T01:00:00.000000Z"}}
{"type": "item_uncomplete", "uuid": "...", "args": {"id": "2995104339"}}
{"type": "item_close", "uuid": "...", "args": {"id": "2995104339"}}
```

### Complete a recurring task

```bash
{
    "type": "item_update_date_complete",
    "uuid": "...",
    "args": {
        "id": "2995104339",
        "due": {"date": "2014-10-30", "string": "every day"},
        "is_forward": 1,
        "reset_subtasks": 0
    }
}
```

### Update day orders

```bash
{
    "type": "item_update_day_orders",
    "uuid": "...",
    "args": {"ids_to_orders": {"2995104339": 1}}
}
```

## Filters

Availability and limits depend on the user plan (`filters` and `max_filters` in user plan limits).

Example:

```json
{
    "id": "4638878",
    "name": "Important",
    "query": "priority 1",
    "color": "lime_green",
    "item_order": 3,
    "is_deleted": false,
    "is_favorite": false,
    "is_frozen": false
}
```

### Properties

| Property | Description |
| --- | --- |
| `id` String | The ID of the filter. |
| `name` String | The name of the filter. |
| `query` String | The query to search for. |
| `color` String | The color of the filter icon. |
| `item_order` Integer | Filter's order in the filter list. |
| `is_deleted` Boolean | Marked as deleted. |
| `is_favorite` Boolean | Marked as favorite. |
| `is_frozen` Boolean | Read-only filter from a canceled subscription. |

### Add / Update / Delete

```bash
{"type": "filter_add", "temp_id": "...", "uuid": "...", "args": {"name": "Important", "query": "priority 1"}}
{"type": "filter_update", "uuid": "...", "args": {"id": "4638879", "name": "Not Important", "query": "priority 4"}}
{"type": "filter_delete", "uuid": "...", "args": {"id": "9"}}
```

### Update multiple filter orders

```bash
{
    "type": "filter_update_orders",
    "uuid": "...",
    "args": {"id_order_mapping": {"4638878": 1, "4638879": 2}}
}
```

## Workspace Filters

The maximum number of saved filters depends on the workspace's current plan (`max_filters` inside `limits` on the workspace object).

Example:

```json
{
    "id": "123456",
    "workspace_id": "789012",
    "name": "Team Priorities",
    "query": "priority 1 & assigned to: team",
    "color": "red",
    "item_order": 1,
    "is_deleted": false,
    "is_favorite": true,
    "is_frozen": false,
    "creator_uid": "111222",
    "updater_uid": "111222",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
}
```

### Add / Update / Delete / Reorder

```bash
{"type": "workspace_filter_add", "temp_id": "...", "uuid": "...", "args": {"workspace_id": "789012", "name": "Team Priorities", "query": "priority 1 & assigned to: team"}}
{"type": "workspace_filter_update", "uuid": "...", "args": {"id": "123456", "name": "High Priority Team Tasks", "is_favorite": true}}
{"type": "workspace_filter_delete", "uuid": "...", "args": {"id": "123456"}}
{"type": "workspace_filter_update_orders", "uuid": "...", "args": {"id_order_mapping": {"123456": 1, "123457": 2}}}
```

Key differences from personal filters:

- Workspace filters require membership in the associated workspace.
- Changes propagate to all workspace members via sync events.
- Permissions are checked through workspace membership rather than user ownership.

## Ids — id mapping endpoint

`GET /api/v1/id_mappings/{obj_name}/{obj_ids}`

Translates IDs from v1 to v2 or vice versa. IDs are not unique across object types, hence the need to specify the object type.

**Path parameters:**

- `obj_name` — `sections` | `tasks` | `comments` | `reminders` | `location_reminders` | `projects`
- `obj_ids` — A comma-separated list of IDs (e.g. `6VfWjjjFg2xqX6Pa,6WMVPf8Hm8JP6mC8`)

**Response (200):**

```json
[
  {"old_id": "918273645", "new_id": "6VfWjjjFg2xqX6Pa"}
]
```

## Workspace REST endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/workspaces/invitations/delete` | Delete a workspace invitation. Admins only. |
| `GET` | `/api/v1/workspaces/invitations/all` | List all pending invitations to a workspace. |
| `PUT` | `/api/v1/workspaces/invitations/{invite_code}/accept` | Accept a workspace invitation. |
| `PUT` | `/api/v1/workspaces/invitations/{invite_code}/reject` | Reject a workspace invitation. |
| `GET` | `/api/v1/workspaces/{workspace_id}/projects/archived` | Archived projects (paginated). |
| `GET` | `/api/v1/workspaces/{workspace_id}/projects/active` | Active projects (paginated). |
| `POST` | `/api/v1/workspaces/{workspace_id}/users/invite` | Invite users by email. |
| `GET` | `/api/v1/workspaces/plan_details` | Plan details and usage. |
| `GET` | `/api/v1/workspaces/invitations` | List user emails with pending invites. |
| `GET` | `/api/v1/workspaces/users` | All workspace_users (paginated). |
| `POST` | `/api/v1/workspaces/join` | Join a workspace via link or by domain. |
| `POST` | `/api/v1/workspaces/logo` | Upload or delete workspace logo. |
| `DELETE` | `/api/v1/workspaces/{workspace_id}/users/{user_id}` | Remove user. |
| `POST` | `/api/v1/workspaces/{workspace_id}/users/{user_id}` | Update user role. |
| `DELETE` | `/api/v1/workspaces/{workspace_id}` | Delete a workspace. |
| `GET` | `/api/v1/workspaces/{workspace_id}` | Get a workspace. |
| `POST` | `/api/v1/workspaces/{workspace_id}` | Update a workspace. |
| `GET` | `/api/v1/workspaces` | List workspaces the user belongs to. |
| `POST` | `/api/v1/workspaces` | Create a workspace. |

## Projects REST endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/projects/permissions` | Available roles and their permissions. |
| `GET` | `/api/v1/projects/archived` | Archived projects (paginated). |
| `GET` | `/api/v1/projects/search` | Search active projects by name (paginated). |
| `GET` | `/api/v1/projects/{project_id}/collaborators` | List collaborators (paginated). |
| `POST` | `/api/v1/projects/{project_id}/unarchive` | Unarchive. |
| `POST` | `/api/v1/projects/{project_id}/archive` | Archive. |
| `POST` | `/api/v1/projects/{project_id}/join` | Join (workspace projects only). |
| `DELETE` | `/api/v1/projects/{project_id}` | Delete. |
| `GET` | `/api/v1/projects/{project_id}` | Get a project. |
| `POST` | `/api/v1/projects/{project_id}` | Update a project. |
| `POST` | `/api/v1/projects` | Create a project. |
| `GET` | `/api/v1/projects` | List active projects (paginated). |

### Project search query syntax

`query` (required, 1-1024 chars) supports literal matching (case-insensitive) with `*` as a wildcard. Use `\*` for literal asterisk and `\\` for literal backslash.

Examples:

- `Inbox`
- `Client *`
- `Q* 2026`
- `Draft\*`

## Colors

Some objects (projects, labels, filters) use color identifiers.

| ID | Name | Hex | | ID | Name | Hex |
| --- | --- | --- | --- | --- | --- | --- |
| 30 | berry_red | #B8255F | | 40 | light_blue | #6988A4 |
| 31 | red | #DC4C3E | | 41 | blue | #4180FF |
| 32 | orange | #C77100 | | 42 | grape | #692EC2 |
| 33 | yellow | #B29104 | | 43 | violet | #CA3FEE |
| 34 | olive_green | #949C31 | | 44 | lavender | #A4698C |
| 35 | lime_green | #65A33A | | 45 | magenta | #E05095 |
| 36 | green | #369307 | | 46 | salmon | #C9766F |
| 37 | mint_green | #42A393 | | 47 | charcoal | #808080 |
| 38 | teal | #148FAD | | 48 | grey | #999999 |
| 39 | sky_blue | #319DC0 | | 49 | taupe | #8F7A69 |

## Comments REST endpoints

| Method | Path | Description |
| --- | --- | --- |
| `DELETE` | `/api/v1/comments/{comment_id}` | Delete a comment. |
| `GET` | `/api/v1/comments/{comment_id}` | Get a comment. |
| `POST` | `/api/v1/comments/{comment_id}` | Update a comment. |
| `POST` | `/api/v1/comments` | Create a comment (`task_id` XOR `project_id` required). |
| `GET` | `/api/v1/comments` | List comments (`task_id` XOR `project_id`, paginated). |

## Templates

Availability of project templates functionality depends on the user plan (`templates` in user plan limits).

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/templates/import_into_project_from_template_id` | Import template by ID. |
| `POST` | `/api/v1/templates/import_into_project_from_file` | Import template from CSV file. |
| `POST` | `/api/v1/templates/create_project_from_file` | Create a new project from template file. |
| `GET` | `/api/v1/templates/file` | Export project as CSV. |
| `GET` | `/api/v1/templates/url` | Export project as shareable URL. |

## Sections REST endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/sections/search` | Search active sections by name (paginated). |
| `POST` | `/api/v1/sections/{section_id}/unarchive` | Unarchive. |
| `POST` | `/api/v1/sections/{section_id}/archive` | Archive. |
| `DELETE` | `/api/v1/sections/{section_id}` | Delete. |
| `GET` | `/api/v1/sections/{section_id}` | Get a section. |
| `POST` | `/api/v1/sections/{section_id}` | Update a section. |
| `POST` | `/api/v1/sections` | Create a section. |
| `GET` | `/api/v1/sections` | List sections (paginated). |

## Tasks REST endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/tasks/completed/by_completion_date` | Completed tasks by completion date (up to 3 months). |
| `GET` | `/api/v1/tasks/completed/by_due_date` | Completed tasks by due date (up to 6 weeks). |
| `GET` | `/api/v1/tasks/filter` | Tasks matching a filter expression. |
| `POST` | `/api/v1/tasks/quick` | Quick Add (natural language). |
| `POST` | `/api/v1/tasks/{task_id}/reopen` | Reopen a task. |
| `POST` | `/api/v1/tasks/{task_id}/close` | Close a task. |
| `POST` | `/api/v1/tasks/{task_id}/move` | Move a task. |
| `DELETE` | `/api/v1/tasks/{task_id}` | Delete a task. |
| `GET` | `/api/v1/tasks/{task_id}` | Get a task. |
| `POST` | `/api/v1/tasks/{task_id}` | Update a task. |
| `POST` | `/api/v1/tasks` | Create a task. |
| `GET` | `/api/v1/tasks` | List active tasks (filterable, paginated). |

### Quick Add syntax overview

- **Due dates**: `today`, `tomorrow at 5pm`, `next Monday`
- **Projects**: `#ProjectName` (use `#My\\ Project` for names with spaces)
- **Sections**: `/SectionName` (requires a project)
- **Labels**: `@labelname`
- **Priority**: `p1` to `p4`, `P1` to `P4`, or `!!1` to `!!4`
- **Assignees**: `+Name` (requires a project)
- **Deadlines**: `{date expression}` (e.g., `{tomorrow}`, `{in 3 days}`)
- **Descriptions**: `// description text` (must be at the end)

Examples:

- `"Buy milk today at 5pm #Shopping @groceries p1"`
- `"Team meeting next Monday at 10am #Work +JohnDoe"`
- `"Review PR {Friday} // Check the new authentication flow"`

If parsing fails, the task is still created with the unparsed text in the content. Use `meta=true` to inspect parsing results.

## Labels REST endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/labels/shared/remove` | Remove a shared label from all active tasks. |
| `POST` | `/api/v1/labels/shared/rename` | Rename a shared label across active tasks. |
| `GET` | `/api/v1/labels/search` | Search labels by name (paginated). |
| `GET` | `/api/v1/labels/shared` | List unique shared label names from active tasks (paginated). |
| `DELETE` | `/api/v1/labels/{label_id}` | Delete a personal label. |
| `GET` | `/api/v1/labels/{label_id}` | Get a label. |
| `POST` | `/api/v1/labels/{label_id}` | Update a label. |
| `POST` | `/api/v1/labels` | Create a label. |
| `GET` | `/api/v1/labels` | List labels (paginated). |

## Folders

| Method | Path | Description |
| --- | --- | --- |
| `DELETE` | `/api/v1/folders/{folder_id}` | Delete a folder (projects move out). |
| `GET` | `/api/v1/folders/{folder_id}` | Get a folder. |
| `POST` | `/api/v1/folders/{folder_id}` | Update a folder. |
| `POST` | `/api/v1/folders` | Create a folder in a workspace. |
| `GET` | `/api/v1/folders` | List folders for a workspace (paginated). |

## Uploads

Availability of uploads functionality and the maximum size for a file attachment are dependent on the current user plan (`uploads` and `upload_limit_mb` in user plan limits).

Files can be uploaded to Todoist's servers and used as File Attachments in comments.

| Method | Path | Description |
| --- | --- | --- |
| `DELETE` | `/api/v1/uploads` | Delete an upload (`file_url` query parameter). |
| `POST` | `/api/v1/uploads` | Upload a file (multipart or raw stream). |

Upload supports:

- **Multipart form-data** (recommended): file in a form field, optional `project_id` form field, filename from `Content-Disposition`.
- **Raw binary stream**: file content in body, `Content-Type` set, `X-File-Name` header for the filename, optional `project_id` query parameter.

Optional `project_id` is used to apply workspace-specific upload limits when uploading to a workspace project.

```bash
$ curl https://api.todoist.com/api/v1/uploads \
       -H "Authorization: Bearer 0123456789abcdef0123456789abcdef01234567" \
       -F file=@/path/to/file.pdf
```

Response (200):

```json
{
  "file_url": "string",
  "file_name": "string",
  "file_size": 0,
  "file_type": "string",
  "resource_type": "string",
  "image": "string",
  "image_width": 0,
  "image_height": 0,
  "upload_state": "pending"
}
```

## Filters (REST)

Filters are managed via the `/sync` endpoint (see Filters / Workspace Filters sections above).

## Reminders REST endpoints

Availability of reminders is dependent on the current user plan.

| Method | Path | Description |
| --- | --- | --- |
| `DELETE` | `/api/v1/reminders/{reminder_id}` | Delete a reminder. |
| `GET` | `/api/v1/reminders/{reminder_id}` | Get a reminder. |
| `POST` | `/api/v1/reminders/{reminder_id}` | Update a reminder. |
| `POST` | `/api/v1/reminders` | Create a reminder (relative or absolute). |
| `GET` | `/api/v1/reminders` | List reminders (paginated, optional `task_id`). |

## Location reminders REST endpoints

Availability of location reminders is dependent on the current user plan.

| Method | Path | Description |
| --- | --- | --- |
| `DELETE` | `/api/v1/location_reminders/{reminder_id}` | Delete a location reminder. |
| `GET` | `/api/v1/location_reminders/{reminder_id}` | Get a location reminder. |
| `POST` | `/api/v1/location_reminders/{reminder_id}` | Update a location reminder. |
| `POST` | `/api/v1/location_reminders` | Create a location reminder (`on_enter` / `on_leave`). |
| `GET` | `/api/v1/location_reminders` | List location reminders (paginated, optional `task_id`). |

## Due dates

Todoist supports three types of due dates:

1. **Full-day dates** (e.g. "1 January 2018" or "tomorrow")
2. **Floating due dates with time** (e.g. "1 January 2018 at 12:00")
3. **Due dates with time and fixed timezone** (e.g. "1 January 2018 at 12:00 America/Chicago")

Unless specified explicitly, dates with time are created as floating. Any due date can be set to recurring or not, depending on the date string.

### Full-day dates

```json
{
    "date": "2016-12-01",
    "timezone": null,
    "string": "every day",
    "lang": "en",
    "is_recurring": true
}
```

| Property | Description |
| --- | --- |
| `date` String | Due date `YYYY-MM-DD` (RFC 3339). |
| `timezone` String | Always `null`. |
| `string` String | Human-readable representation. |
| `lang` String | Language for parsing the string. |
| `is_recurring` Boolean | True for recurring. |

### Floating due dates with time

```json
{
    "date": "2016-12-01T12:00:00.000000",
    "timezone": null,
    "string": "every day at 12",
    "lang": "en",
    "is_recurring": true
}
```

`date` format: `YYYY-MM-DDTHH:MM:SS` (no `Z`, no timezone). The date represents an event in the user's timezone.

### Due dates with time and fixed timezone

```json
{
    "date": "2016-12-06T13:00:00.000000Z",
    "timezone": "Europe/Madrid",
    "string": "ev day at 2pm",
    "lang": "en",
    "is_recurring": true
}
```

`date` format: `YYYY-MM-DDTHH:MM:SSZ` (RFC 3339, UTC). `timezone` field tracks the original timezone.

### Create or update due dates

From a user-provided string:

```json
"due": {"string": "tomorrow"}
"due": {"string": "tomorrow at 12"}
"due": {"string": "tomorrow at 12", "timezone": "Asia/Jakarta"}
```

From a date object:

```json
"due": {"date": "2018-10-14"}
"due": {"date": "2018-10-14T10:00:00.000000"}        // floating
"due": {"date": "2018-10-14T05:00:00.000000Z"}       // fixed UTC
```

Recurring due dates can only be created via the string form.

Valid `lang` values: `en`, `da`, `pl`, `zh`, `ko`, `de`, `pt`, `ja`, `it`, `fr`, `sv`, `ru`, `es`, `nl`, `fi`, `nb`, `tw`.

## Deadlines

Deadlines are similar to due dates but only support non-recurring dates with no time component.

```json
{
    "date": "2016-12-01"
}
```

| Property | Description |
| --- | --- |
| `date` String | Deadline `YYYY-MM-DD` (RFC 3339). |
| `lang` String | Returned only on output for future compatibility. |

Set or update via `"deadline": {"date": "2024-01-25"}`.

## User REST endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/tasks/completed/stats` | Productivity statistics. |
| `PUT` | `/api/v1/notification_setting` | Update a notification setting (per type and channel). |
| `GET` | `/api/v1/user` | Current user info. |

`PUT /api/v1/notification_setting` accepts:

- `notification_type` (required) — see live notification types.
- `service` (required) — `email` or `push`.
- `token` (optional)
- `dont_notify` (optional)

## Activity

Availability of the activity log and the duration of event storage are dependent on the current user plan (`activity_log` and `activity_log_limit` in user plan limits).

The activity log uses the same cursor-based pagination as other endpoints.

### Logged events

Currently the official Todoist clients present only the most important events.

**Items:** added, updated (only changes to `content`, `description`, `due_date` and `responsible_uid`), deleted, completed, uncompleted.

**Notes:** added, updated (only changes to `content` or `file_name` if the former is empty), deleted.

**Projects:** added, updated (only changes to `name`), deleted, archived, unarchived, shared, left.

### Pagination

The endpoint uses cursor-based pagination with `cursor` and `limit` query parameters.

- `limit`: how many activity events to return per page. Default 50, max 100.
- `cursor`: opaque token from the `next_cursor` field of the previous response. When `next_cursor` is `null`, no more results.

To fetch all activity events:

```bash
curl "https://api.todoist.com/api/v1/activities?limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

The response includes `results` and `next_cursor`. Use `next_cursor` as the `cursor` value to fetch the next page.

**Note:** The `page` and `offset` parameters from the legacy Sync API v9 (`/api/v9/activity/get`) are not supported by this endpoint.

### `GET /api/v1/activities`

Returns a paginated list of activity events for the user. Events can be filtered by object type (project, item, note), event type, and other criteria.

Key query parameters:

- `object_type` — `project`, `item`, `note`, or `section`. Used with `object_id`.
- `object_id` — Specific object ID.
- `parent_project_id` / `parent_item_id` — Filter by ancestor.
- `include_parent_object` / `include_child_objects` — Include parent or descendants in results.
- `initiator_id` / `initiator_id_null` — Filter by user(s) that initiated events.
- `event_type` — Simple event type (e.g. `added`, `deleted`, `completed`, `updated`). Spans all object types that support it.
- `object_event_types` — Advanced filter using `object_type:event_type` strings (e.g. `["item:deleted"]`, `["item:", "note:added"]`, `[":deleted"]`). Recommended.
- `workspace_id` — Workspace IDs or `null` for personal projects.
- `annotate_notes` / `annotate_parents` — Include extra context in `extra_data`.
- `cursor`, `limit` — Pagination.
- `date_from`, `date_to` — ISO 8601 date range overrides.

## Backups

Availability of backups functionality is dependent on the current user plan (`automatic_backups` in user plan limits).

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/backups/download` | Download a backup file. |
| `GET` | `/api/v1/backups` | List backup archives. |

When using the default token, with the `data:read_write` scope, and having MFA enabled, the MFA token is required and must be provided with the request. To use this endpoint without an MFA token, the token must have the `backups:read` scope.

## Emails

| Method | Path | Description |
| --- | --- | --- |
| `DELETE` | `/api/v1/emails` | Disable the current email address for a Todoist object. |
| `PUT` | `/api/v1/emails` | Get or create an email address for a project or task. |

`obj_type` is `project`, `project_comments`, or `task`.

## Webhooks

The Todoist Webhooks API allows applications to receive real-time notification (in the form of HTTP POST payload) on the subscribed user events.

### Important Considerations

Todoist only allows webhook URLs with HTTPS and no port:

- Allowed: `https://nice.integration.com`
- Disallowed: `http://evil.integration.com`, `https://bad.integration.com:5980`

Webhook requests may arrive delayed, out of order, or fail to arrive entirely. Webhooks should be used as notifications, not primary data sources.

### Webhook Activation & Personal Use

Webhooks fire for users who complete the OAuth flow of the app that declares the webhook. They don't fire by default for the user that has created the Todoist app.

To activate webhooks for personal use:

1. Perform the authorization request in the browser and capture the `code` via the browser's developer tools.
2. Perform the token exchange request through a tool like Postman and read the `access_token` from the response (it must be a POST, can't be done in the browser).

### Configuration

Configure your webhook in the App Management Console.

### Events

| Event Name | Description | Event Data |
| --- | --- | --- |
| `item:added` | A task was added | The new Task. |
| `item:updated` | A task was updated | The updated Task. |
| `item:deleted` | A task was deleted | The deleted Task. |
| `item:completed` | A task was completed | The completed Task. |
| `item:uncompleted` | A task was uncompleted | The uncompleted Task. |
| `note:added` | A comment was added | The new Comment. |
| `note:updated` | A comment was updated | The updated Comment. |
| `note:deleted` | A comment was deleted | The deleted Comment. |
| `project:added` | A project was added | The new Project. |
| `project:updated` | A project was updated | The updated Project. |
| `project:deleted` | A project was deleted | The deleted Project. |
| `project:archived` | A project was archived | The archived Project. |
| `project:unarchived` | A project was unarchived | The unarchived Project. |
| `section:added` | A section was added | The new Section. |
| `section:updated` | A section was updated | The updated Section. |
| `section:deleted` | A section was deleted | The deleted Section. |
| `section:archived` | A section was archived | The archived Section. |
| `section:unarchived` | A section was unarchived | The unarchived Section. |
| `label:added` | A label was added | The new Label. |
| `label:deleted` | A label was deleted | The deleted Label. |
| `label:updated` | A label was updated | The updated Label. |
| `filter:added` | A filter was added | The new Filter. |
| `filter:deleted` | A filter was deleted | The deleted Filter. |
| `filter:updated` | A filter was updated | The updated Filter. |
| `reminder:fired` | A reminder has fired | The Reminder that fired. |

### Events Extra

Some events can include extra meta information in the `event_data_extra` field.

| Event Name | Description | Event Data |
| --- | --- | --- |
| `item:updated` | For events issued by the user directly these include `old_item` and `update_intent` | `old_item` will be a Task; `update_intent` can be `item_updated`, `item_completed`, `item_uncompleted`. |

### Request Format

Example webhook request:

```http
POST /payload HTTP/1.1
Host: your_callback_url_host
Content-Type: application/json
X-Todoist-Hmac-SHA256: UEEq9si3Vf9yRSrLthbpazbb69kP9+CZQ7fXmVyjhPs=

{
    "event_name": "item:added",
    "user_id": "2671355",
    "event_data": {
        "added_by_uid": "2671355",
        "assigned_by_uid": null,
        "checked": false,
        "child_order": 3,
        "collapsed": false,
        "content": "Buy Milk",
        "description": "",
        "added_at": "2025-02-10T10:33:38.000000Z",
        "completed_at": null,
        "due": null,
        "deadline": null,
        "id": "6XR4GqQQCW6Gv9h4",
        "is_deleted": false,
        "labels": [],
        "parent_id": null,
        "priority": 1,
        "project_id": "6XR4H993xv8H5qCR",
        "responsible_uid": null,
        "section_id": null,
        "url": "https://app.todoist.com/app/task/6XR4GqQQCW6Gv9h4",
        "user_id": "2671355"
    },
    "initiator": {
        "email": "alice@example.com",
        "full_name": "Alice",
        "id": "2671355",
        "image_id": "ad38375bdb094286af59f1eab36d8f20",
        "is_premium": true
    },
    "triggered_at": "2025-02-10T10:39:38.000000Z",
    "version": "10"
}
```

| Property | Description |
| --- | --- |
| `event_name` String | The event name. |
| `user_id` String | The destination user ID. |
| `event_data` Object | The modified entity. |
| `version` String | Webhook version configured in App Management Console. |
| `initiator` Object | Collaborator that triggered the event. |
| `triggered_at` String | When the event was triggered. |
| `event_data_extra` Object | Optional meta information. |

### Request Headers

| Header | Description |
| --- | --- |
| `User-Agent` | `Todoist-Webhooks` |
| `X-Todoist-Hmac-SHA256` | SHA256 HMAC of the request payload using your `client_secret`, base64-encoded. |
| `X-Todoist-Delivery-ID` | Unique delivery ID. Re-deliveries reuse the same ID. |

### Failed Delivery

When delivery fails (server/network error, non-200 response), it's reattempted after 15 minutes, up to three retries.

Your endpoint must respond with HTTP 200.

## Pagination

Many endpoints return paginated results to handle large datasets efficiently.

### How Pagination Works

Cursor-based pagination. Use an opaque cursor token to retrieve the next set of results.

Response format:

- `results`: array of objects
- `next_cursor`: token for the next page, or `null` if no more results

```json
{
  "results": [
    {"id": "abc123", "content": "Task 1"},
    {"id": "def456", "content": "Task 2"}
  ],
  "next_cursor": "eyJwYWdlIjoyLCJsaW1pdCI6NTB9.aGFzaA"
}
```

### Making Paginated Requests

First request:

```bash
curl "https://api.todoist.com/api/v1/tasks?limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Subsequent requests:

```bash
curl "https://api.todoist.com/api/v1/tasks?cursor=eyJwYWdlIjoyLCJsaW1pdCI6NTB9.aGFzaA&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Important:** Always use the same parameters when using a cursor.

### Pagination Parameters

- `limit`: Default 50, max 200. Larger values return a validation error.
- `cursor`: Opaque token from the previous `next_cursor`. User-specific and parameter-dependent. Don't decode, parse, modify, or store long-term.

### Best Practices

- Handle concurrent modifications: Todoist data may change while paginating; implement deduplication if needed.
- Don't store cursors long-term.
- Process all pages or stop early as needed.

### Error Handling

Invalid cursor:

```json
{
  "error": "Invalid argument value",
  "error_code": 20,
  "error_extra": {"argument": "cursor"},
  "error_tag": "INVALID_ARGUMENT_VALUE",
  "http_code": 400
}
```

Invalid limit (>200):

```json
{
  "error": "Invalid argument value",
  "error_code": 20,
  "error_extra": {
    "argument": "limit",
    "expected": "Input should be less than or equal to 200"
  },
  "error_tag": "INVALID_ARGUMENT_VALUE",
  "http_code": 400
}
```

Example: fetching all tasks in Python:

```python
import requests

token = "YOUR_TOKEN"
url = "https://api.todoist.com/api/v1/tasks"
headers = {"Authorization": f"Bearer {token}"}

all_tasks = []
cursor = None

while True:
    params = {"limit": 100}
    if cursor:
        params["cursor"] = cursor

    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    data = response.json()

    all_tasks.extend(data["results"])

    cursor = data.get("next_cursor")
    if not cursor:
        break

print(f"Fetched {len(all_tasks)} tasks")
```

## Request limits

### Payload Size

There is a 1 MiB HTTP request body limit on POST requests.

The maximum payload size for an attachment upload depends on the user plan (`upload_limit_mb` in user plan limits).

### Header Size

Total HTTP header size cannot exceed 65 KiB.

### Processing Timeouts

| Type | Limit |
| --- | --- |
| Uploads | 5 minutes |
| Standard Request | 15 seconds |

### Rate Limiting

For each user, you can make a maximum of:

- **1000 partial sync requests** within a 15 minute period.
- **100 full sync requests** within a 15 minute period.

You can reduce the number of requests by batching up to 100 commands in each request.

### Maximum Sync Commands

Maximum 100 commands per request.

## URL schemes

### Mobile app URL schemes

Custom URL schemes for launching to specific views and initiating common actions.

#### Views

| Scheme | Description |
| --- | --- |
| `todoist://` | Default view. |
| `todoist://today` | Today view. |
| `todoist://upcoming` | Upcoming view. |
| `todoist://profile` | Profile view. |
| `todoist://inbox` | Inbox view. |
| `todoist://teaminbox` | Team inbox view. |
| `todoist://notifications` | Notifications view. |

#### Tasks

```
todoist://addtask?content=mytask&date=tomorrow&priority=4
```

| Scheme | Description |
| --- | --- |
| `todoist://task?id={id}` | Open a task by ID. |
| `todoist://addtask` | Open the add task view (with optional pre-filled values). |

`todoist://addtask` accepts `content` (URL-encoded), `date` (URL-encoded), `priority` (1-4 with the API mapping where p1 = 4).

#### Projects

| Scheme | Description |
| --- | --- |
| `todoist://projects` | Projects list. |
| `todoist://project?id={id}` | Open a specific project by ID. |

#### Labels / Filters / Search

| Scheme | Description |
| --- | --- |
| `todoist://labels` | Labels list. |
| `todoist://label?name={name}` | Open a specific label by name. |
| `todoist://filters` | Filters list. |
| `todoist://filter?id={id}` | Open a specific filter by ID. |
| `todoist://search?query={query}` | Search (Android only). |

### Desktop app URL schemes

| Scheme | Description | Min version |
| --- | --- | --- |
| `todoist://` | Open Todoist. | 9.2.0 |
| `todoist://inbox` | Inbox. | 9.2.0 |
| `todoist://today` | Today. | 9.2.0 |
| `todoist://upcoming` | Upcoming. | 9.2.0 |
| `todoist://project?id={id}` | Project detail. | 9.2.0 |
| `todoist://task?id={id}` | Task detail. | 9.2.0 |
| `todoist://openquickadd?content={content}&description={description}` | Open global quick add (optionally refilled). | 9.2.0 |
| `todoist://notifications` | Notifications. | 9.10.0 |
| `todoist://filters-labels` | Filters & labels. | 9.10.0 |
| `todoist://filter?id={id}` | Filter view. | 9.10.0 |
| `todoist://label?id={id}` | Label view. | 9.10.0 |
| `todoist://search?query={query}` | Search view. | 9.10.0 |
| `todoist://projects` | My projects view. | 9.10.0 |
| `todoist://projects?workspaceId={id}` | Workspace projects view. | 9.10.0 |
| `todoist://templates` | Templates view. | 9.10.0 |
| `todoist://templates?id={id}` | Template view. | 9.10.0 |

## Migrating from v9

The Todoist API v1 is a new API that unifies the Sync API v9 and the REST API v2. The documentation for the Sync API v9 and REST API v2 are still available for reference.

### General changes

#### Lowercase endpoints

Todoist API v1 endpoints are lowercase (mostly snake_case). Mixed casing is rejected. As an example: `https://api.todoist.com/api/v9/Sync` would have been accepted before but now `https://api.todoist.com/API/v9/Sync` returns 404.

#### Subdomain

After Todoist API v1, only `api.todoist.com` is the subdomain. Migrate any other subdomains.

#### IDs

Since 2023, objects returned `v2_*_id` attributes. That "v2 id" has now become the main `id`.

IDs have been opaque strings almost everywhere since the release of Sync API v9, but were still mostly numbers in that version. This version officially makes them non-number opaque strings.

The `v2_*_id` attribute is still available on Sync API v9, but was removed on the new version.

You can rely on `/api/v1/id_mappings/<object>/<id>[,<id>]` to translate between both ID versions (up to 100 IDs of the same object).

Old IDs will NOT be accepted in this new API version for the following objects:

- notes / comments
- items / tasks
- projects
- sections
- notifications / reminders
- notifications_locations / location_reminder

#### Task URLs

The `url` property has been removed from the task object. Valid task URLs are now formatted as:

```
https://app.todoist.com/app/task/<v2_id>
```

#### Pagination

This version adds pagination to many endpoints. The following endpoints are now paginated:

- `/api/v1/tasks`
- `/api/v1/tasks/filter`
- `/api/v1/labels`
- `/api/v1/labels/shared`
- `/api/v1/comments`
- `/api/v1/sections`
- `/api/v1/projects`
- `/api/v1/projects/archived`
- `/api/v1/projects/<project_id>/collaborators`
- `/api/v1/activities`

#### Previous REST API endpoints error responses

All endpoints related to `/tasks`, `/comments`, `/sections`, `/projects`, and `/labels` now return `application/json` errors (previously `text/plain`):

```json
{
  "error": "Task not found",
  "error_code": 478,
  "error_extra": {"event_id": "<hash>", "retry_after": 3},
  "error_tag": "NOT_FOUND",
  "http_code": 404
}
```

### Object renames

| Sync v9 / REST v2 | Todoist API v1 |
| --- | --- |
| items | tasks |
| notes | comments |
| notifications | reminders |
| notifications_locations | location_reminders |

The `/sync` and `/activities` endpoints retain old naming for now.

### URL renames

| Sync v9 / REST v2 | Todoist API v1 |
| --- | --- |
| `/api/v9/update_notification_setting` | `PUT /api/v1/notification_setting` |
| `/api/v9/uploads/add` | `POST /api/v1/uploads` |
| `/api/v9/uploads/get` | `GET /api/v1/uploads` |
| `/api/v9/uploads/delete` | `DELETE /api/v1/uploads` |
| `/api/v9/backups/get` | `GET /api/v1/backups` |
| `/api/v9/access_tokens/revoke` | `DELETE /api/v1/access_tokens` |
| `/api/access_tokens/revoke` | `DELETE /api/v1/access_tokens` |
| `/api/access_tokens/migrate_personal_token` | `POST /api/v1/access_tokens/migrate_personal_token` |
| `/api/v9/access_tokens/migrate_personal_token` | `POST /api/v1/access_tokens/migrate_personal_token` |
| `/api/v9/archive/sections` | `GET /api/v1/sections/archived` |
| `/api/v9/quick/add` | `POST /api/v1/tasks/quick` |
| `/api/v9/emails/get_or_create` | `PUT /api/v1/emails` |
| `/api/v9/emails/disable` | `DELETE /api/v1/emails` |
| `/api/v9/get_productivity_stats` | `GET /api/v1/tasks/completed/stats` |
| `/api/v9/completed/get_stats` | `GET /api/v1/tasks/completed/stats` |
| `/api/v9/completed/get_all` | `GET /api/v1/tasks/completed` |
| `/api/v9/projects/get_archived` | `GET /api/v1/projects/archived` |
| `/api/v9/projects/join` | `POST /api/v1/projects/<project_id>/join` |
| `/api/v9/workspaces/projects/active` | `GET /api/v1/workspaces/<workspace_id>/projects/active` |
| `/api/v9/workspaces/projects/archived` | `GET /api/v1/workspaces/<workspace_id>/projects/archived` |
| `/api/v9/workspaces/update_logo` | `POST /api/v1/workspaces/logo` |
| `/api/v9/workspaces/invitations/accept` | `PUT /api/v1/workspaces/invitations/<invitation_code>/accept` |
| `/api/v9/workspaces/invitations/reject` | `PUT /api/v1/workspaces/invitations/<invitation_code>/reject` |
| `/api/v9/workspaces/joinable_workspaces` | `GET /api/v1/workspaces/joinable` |
| `/api/v9/projects/get_data` | `GET /api/v1/projects/<project_id>/full` |
| `/api/v9/templates/import_into_project` | `POST /api/v1/templates/import_into_project_from_file` |
| `/api/v9/templates/export_as_file` | `GET /api/v1/templates/file` |
| `/api/v9/templates/export_as_url` | `GET /api/v1/templates/url` |
| `/api/v9/activity/get` | `GET /api/v1/activities` |
| `/api/v9/tasks/archived/by_due_date` | `GET /api/v1/tasks/completed/by_due_date` |
| `/api/v9/tasks/completed/by_completion_date` | `GET /api/v1/tasks/completed/by_completion_date` |

### Deprecated endpoints

| Sync v9 / REST v2 | New endpoint taking its place |
| --- | --- |
| `/sync/v9/archive/items_many` | `/api/v1/tasks/completed/by_completion_date` |
| `/sync/v9/archive/items` | `/api/v1/tasks/completed/by_completion_date` |
| `/sync/v9/completed/get_all` | `/api/v1/tasks/completed/by_completion_date` |
| `/sync/v9/projects/get` | `/api/v1/projects`, `/api/v1/comment` |
| `/sync/v9/items/get` | `/api/v1/tasks`, `/api/v1/comments`, `/api/v1/projects`, `/api/v1/sections` |
| `/sync/v9/projects/get_data` | `/api/v1/tasks`, `/api/v1/comments`, `/api/v1/projects`, `/api/v1/sections` |

### `/sync` endpoint changes

- Exception for object renames; legacy naming remains.
- `GET` was removed; only `POST` is accepted in v1.
- `day_orders_timestamp` attribute was removed from the response.
- New `full_sync_date_utc` attribute included during initial sync, with the time when that sync data was generated. Big accounts may see delays; an incremental sync is required for up-to-date data.

### Sections

- `collapsed` attribute renamed to `is_collapsed`.

### User

- `is_biz_admin` attribute removed.

### Other endpoints

#### Workspace projects

- `uncompleted_tasks_count` and `total_tasks_count` removed.

#### `/tasks`

- `comment_count` attribute removed (applies to all `/tasks*` endpoints).
- `filter` and `lang` parameters removed. New dedicated endpoint: `/api/v1/tasks/filter`.

#### `/projects`

- `comment_count` attribute removed (applies to all `/projects*` endpoints).

#### `/sections` & `/comments`

- The Todoist API v1 uses the format previously used by the Sync API everywhere.

### Webhooks

There are no changes specific to webhooks, but they will inherit all the formatting and renaming changes outlined above. Developers are expected to change the version of the webhook for their integration and start accepting the new formatting once ready.
