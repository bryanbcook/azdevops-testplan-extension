# Contribution Guidelines

As an open-source project, community contributions are encouraged.

## Local Developer Setup

The local development environment consist of the following:

- node 20.x
- TypeScript 5.6.3
- Visual Studio Code
- PowerShell Core 7.x

```shell
# install typescript dependency
npm install -g typescript@5.6.3

# compile
cd .\PublishTestPlanResultsV1
npm install
tsc
```

To execute the mocha tests:

1. Open VSCode from the `\PublishTestPlanResultsV1` folder
1. Install the "[Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter)" extension
1. Modify the .vscode settings file and adjust the `mochaExplorer.env` with variables that reflect your environment:
   - SYSTEM_COLLECTIONURI: the URL to your Azure DevOps Organization
   - SYSTEM_ACCESSTOKEN: PAT token to your Azure DevOps Organization
   - ENDPOINT_AUTH_PARAMETER_SYSTEMVSSCONNECTION_ACCESSTOKEN: PAT token to your Azure DevOps Organization
   - TEAMPROJECT: the name of an Azure DevOps Project that contains a Test Plan for testing
   - PROJECTID: the guid for the TEAMPROJECT
   - TESTPLANID: the numeric identifier for a Test Plan in your Azure DevOps Project
   - TESTROOTSUITE: the numberic identifier for the top-level suite in the Test Plan
1. Run the tests, they should all pass.

Prior to checking the changes in, please test out your changes locally:

1. Compile the extension (`tsc`)
1. Set breakpoints where appropriate
1. Open a command-prompt and start PowerShell Core (`pwsh.exe`)
1. Run the supplied PowerShell script:

   ```powershell
   cd PublishTestPlanResultsV1
   .\Test-ExtensionLocally.ps1 -DebugMode
   ```

1. Provide the necessary values when prompted or press `enter` to accept default values. To provide prepopulated answers for these prompts, create environment variables `INPUT_<variable-name-in-prompt>`.
1. In VSCode, use `> Attach to NodeJs process`. Provide the PID that appears in the command-output.
