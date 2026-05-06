# Command Variable Resolution Design

## Problem

Quick commands support template variables (`{internalIp}`, `{externalIp}`, `{nodeName}`, `{credentials}`), but there is no variable resolution logic anywhere in the codebase. Commands can only be copied as raw template text. Users need to select a node and get the command with variables replaced by actual field values.

Additionally, users need environment-level custom variables (e.g. `{projectName}`, `{version}`) shared across all nodes in an environment.

## Solution Overview

- Pure frontend variable resolution — string replacement + copy to clipboard
- Two entry points: environment detail page (node card dropdown) and commands page (global env+node selector)
- Environment-level custom variables managed in a dedicated section on the environment detail page
- No backend changes for variable resolution; custom variables stored in existing environment model

## Data Model

Add `customVariables` field to each environment object:

```json
{
  "customVariables": [
    { "key": "projectName", "value": "my-project" },
    { "key": "version", "value": "1.0.0" }
  ]
}
```

- Type: `Array<{ key: string, value: string }>`
- Stored in `data/environments.json`, saved via existing `PUT /api/environments/:id`
- Default: empty array (`[]`) — no error, no effect on resolution

## Variable Resolution Logic

New utility function `resolveCommand(template, node, customVariables)` in `client/src/utils/format.js`:

1. Replace built-in variables: `{internalIp}` → `node.internalIp`, `{externalIp}` → `node.externalIp`, `{nodeName}` → `node.name`, `{credentials}` → `node.credentials`
2. Replace custom variables: iterate `customVariables`, `{key}` → `value`
3. If a variable value is empty or undefined, keep the original placeholder unchanged (no silent data loss)
4. Pure string replacement, no backend call

## UI Changes

### 1. Custom Variables Section (EnvDetailView)

Location: below S3 Config section, before the closing div.

- Section title: "Custom Variables" (same style as "Node Info" — blue vertical bar + bold label)
- Content: editable key-value table (columns: Key, Value, Actions with delete button)
- Bottom: "Add Variable" button adds an empty row
- Inline editing with Ant Design Input components
- Auto-save on blur/change via `PUT /api/environments/:id`
- Empty state: "No custom variables" text + "Add Variable" button

### 2. Node Card Command Dropdown (NodeCard)

Location: next to existing Xshell button.

- Ant Design `Dropdown` component with command list
- Commands loaded from AppContext `commands`
- On select: call `resolveCommand(template, node, env.customVariables)` → copy to clipboard
- Success message shows resolved command: `"Copied: ping 192.168.22.45 -c 4"` (truncated if needed)
- Empty state: "No commands" disabled item
- NodeCard receives `env` (or `customVariables`) as additional prop from EnvDetailView

### 3. Commands Page Global Selector (CommandsView)

Location: between page title and command table.

- Two cascading Select components: environment → node
- Selecting an environment populates the node dropdown
- When both selected:
  - "Command Template" column shows resolved command instead of raw template
  - "Copy" button copies the resolved command
- When not selected: original behavior (show raw template, copy raw template)
- Selector area is compact, inline with the existing header

## Error Handling

- Empty `customVariables`: treated as no custom vars, no error
- Missing variable values: original placeholder preserved in output
- Empty command list: dropdown shows "No commands" disabled item
- Clipboard API failure: `message.error` notification

## Files to Modify

- `client/src/utils/format.js` — add `resolveCommand` function
- `client/src/components/EnvDetailView.jsx` — add custom variables section
- `client/src/components/NodeCard.jsx` — add command dropdown, accept `env` prop
- `client/src/components/CommandsView.jsx` — add global selector, conditional template resolution

No new files, no backend changes.
