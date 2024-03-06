# Configuration

Runtime configuration can be performed via environment variables.

- You can configure the environment variables at the container for production
- You can configure an [`.env` file](https://create-react-app.dev/docs/adding-custom-environment-variables/#adding-development-environment-variables-in-env) for local development.

## Environment Variables

```sh
# Base URL of the or a homeserver, used to display avatars (required)
REACT_APP_HOME_SERVER_URL=https://matrix-client.matrix.org

# Make the description field of a poll mandatory
REACT_APP_POLL_DESCRIPTION_REQUIRED=true

# Show results by participant in the live result UI.
REACT_APP_POLL_SHOW_LIVE_RESULT_BY_NAME=true

# Show the deactivate section for the PDF generator.
REACT_APP_POLL_SHOW_DEACTIVATE_PDF=true

# A comma-separated list of users that should be ignored from the widget, useful for bots that are in the room
REACT_APP_IGNORE_USER_IDS=@bot-1:matrix.org,@bot-2:matrix.org
```

### Customization

More environment variables for UI customization [@matrix-widget-toolkit/mui](https://www.npmjs.com/package/@matrix-widget-toolkit/mui#customization).
