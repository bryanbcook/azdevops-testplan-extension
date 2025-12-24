---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''
---
**Description**

_describe what you are attempting to do and the issue you are experiencing _

_provide the `correlationId` that appears in the task log output:_

```
correlationId: ______
```

_provide sample usage of the task, if applicable_

```yaml
- task: PublishTestPlanResults@0
  inputs:
```

**Environment Details**

_provide details about your pipeline environment_

- build-agent: self-hosted / microsoft-hosted
- build-agent-os: windows / linux
- test-format: xUnit / jUnit / Cucumber
- test-lanugage: C# / Java / JavaScript / Other ___
- pipeline-format: yaml / Designer-based (Classic) / Release Pipeline

**Pipeline Output**

_provide output from the build with diagnostics enabled (system.debug variable set to 'true'). Mask secrets or sensitive information with xxx_:

```shell
paste your build output here
```

**To Reproduce**

Steps to reproduce the behaviour:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behaviour**

A clear and concise description of what you expected to happen.

**Screenshots**

If applicable, add screenshots to help explain your problem.

**Additional context**

Add any other context about the problem here.
