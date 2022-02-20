# vscode-api-linter README

VS Code extension that lints Protobuf files using the [Google API Linter](https://linter.aip.dev/).

## Requirements

Depends on the API linter being found in the `PATH` as `api-linter` or at the location specified by the `api_linter.path` setting. Installation instructions can be found [here](https://linter.aip.dev/#installation).

## Extension Settings

This extension contributes the following settings:

| Setting              | Default      | Description                                                                               |
| -------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| `api_linter.enabled` | `true`       | Enable/disable the linter                                                                 |
| `api_linter.path`    | `api-linter` | Path to the linter executable                                                             |
| `api_linter.args`    | []           | String or string array of linter arguments. See `api-linter --help` for more information. |

## Credits

- Google: gRPC, api-linter
- [protolint](https://github.com/plexsystems/vscode-protolint): This extension is mostly just an adaptation of their codebase.
