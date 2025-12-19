import { expect } from 'chai';
import * as path from 'path';
import { TestCaseMatchingStrategy } from '../processing/TestResultMatchStrategy';
import { TaskParameters } from '../TaskParameters';
import * as util from './testUtil';
import FeatureFlags, { FeatureFlag } from '../services/FeatureFlags';

describe('TaskParameters', () => {

  var accessToken: string;
  var subject: TaskParameters;

  beforeEach(() => {
    util.clearData();
    subject = TaskParameters.getInstance();

    accessToken = (process.env.SYSTEM_ACCESSTOKEN ?? process.env.ENDPOINT_AUTH_PARAMETER_SYSTEMVSSCONNECTION_ACCESSTOKEN) as string;

    util.setSystemVariable("System.CollectionUri", process.env.SYSTEM_COLLECTIONURI as string);
    util.setSystemVariable("System.AccessToken", process.env.SYSTEM_ACCESSTOKEN as string);
    util.setSystemVariable("ENDPOINT_AUTH_PARAMETER_SYSTEMVSSCONNECTION_ACCESSTOKEN", process.env.SYSTEM_ACCESSTOKEN as string);
    util.setSystemVariable("System.TeamProject", process.env.TEAMPROJECT as string);
    util.setSystemVariable("System.AgentVersion", "3.220.3");
    util.clearSystemVariable("Agent.CloudId");
  });

  afterEach(() => {
    util.clearData();
  });

  context('Default common telemetry properties', () => {
    it('Should include correlationId and taskVersion in telemetry payload', () => {
      // arrange
      util.loadData();

      // act
      subject = TaskParameters.getInstance();

      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.correlationId).to.not.be.undefined;
      expect(telemetry.taskVersion).to.not.be.undefined;
    });

    it('Should detect nodejs version in telemetry payload', () => {
      // 
      util.loadData();

      // act
      subject = TaskParameters.getInstance();

      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.nodeVersion).to.eq(process.version);
    });

    it('Should include agentVersion in telemetry payload', () => { 
      // arrange
      util.loadData();

      // act
      subject = TaskParameters.getInstance();

      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.agentVersion).to.eq("3.220.3");
    });

    it('Should reflect running in a build pipeline in telemetry payload', () => {
      // arrange
      util.setSystemVariable("BUILD_BUILDID", "1234");
      util.loadData();

      // act
      subject = TaskParameters.getInstance();

      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.hostType).to.be.eq("build");
    });

    it('Should reflect running in a release pipeline in telemetry payload', () => {
      // arrange
      util.setSystemVariable("RELEASE_RELEASEURI", "vstfs:///Release/Release/1");
      util.setSystemVariable("RELEASE_ENVIRONMENTURI", "vstfs:///Release/Environment/1");
      util.loadData();

      // act
      subject = TaskParameters.getInstance();

      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.hostType).to.be.eq("release");
    });

    it('Should reflect running on a hosted agent in telemetry payload', () => {
      // arrange
      util.setSystemVariable("Agent.CloudId", "12345");
      util.loadData();

      // act
      subject = TaskParameters.getInstance();
      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.agentType).to.be.eq("Hosted");
    });

    it('Should reflect running on a self-hosted agent in telemetry payload', () => {
      // arrange
      util.loadData();

      // act
      subject = TaskParameters.getInstance();

      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.agentType).to.be.eq("OnPremises");
    });
  });

  context('TestResultContextParameters', () => {

    context('user supplied values', () => {
      it('Should use custom url, project or access token if provided', () => {
        // arrange
        util.setInput("collectionUri", "https://my");
        util.setInput("projectName", "myProject");
        util.setInput("accessToken", "myToken")
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        expect(parameters.collectionUri).to.eq("https://my");
        expect(parameters.accessToken).to.eq("myToken");
        expect(parameters.projectName).to.eq("myProject");
      });

      it('Should record that custom url, project or access token were provided in telemetry', () => {
        // arrange
        util.setInput("collectionUri", "https://my");
        util.setInput("projectName", "myProject");
        util.setInput("accessToken", "myToken")
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.accessToken_custom).to.be.true;
        expect(telemetry.collectionUri_custom).to.be.true;
        expect(telemetry.projectName_custom).to.be.true;

        expect(telemetry.collectionUri).to.not.be.undefined;
        expect(telemetry.projectName).to.not.be.undefined;
      });

      it('Should detect when custom url is Azure DevOps Services in telemetry', () => {
        // arrange
        util.setInput("collectionUri", "https://dev.azure.com/myOrg");
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.serverType).to.be.eq("Hosted");
      });

      it('Should detect when custom url is Azure DevOps Services (old url) in telemetry', () => {
        // arrange
        util.setInput("collectionUri", "https://myOrg.visualstudio.com");
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.serverType).to.be.eq("Hosted");
      });

      it('Should detect when custom url is Azure DevOps Server in telemetry', () => {
        // arrange
        util.setInput("collectionUri", "https://myserver.com/tfs/myOrg");
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.serverType).to.be.eq("OnPremises");
      });

      it('Should anonymize url + project name in telemetry', () => {
        // arrange
        util.setInput("collectionUri", "https://my");
        util.setInput("projectName", "myProject");
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.collectionUri).to.not.equal(parameters.collectionUri)
        expect(telemetry.projectName).to.not.equal(parameters.projectName);
      });

      it('Should not include access token value in telemetry', () => {
        // arrange
        util.setInput("collectionUri", "https://my");
        util.setInput("projectName", "myProject");
        util.setInput("accessToken", "myToken")
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.accesstoken).to.be.undefined;
      });

      it('Should resolve testPlan if provided', () => {
        // arrange
        util.setInput("testPlan", "My Test Plan");
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        expect(parameters.testPlan).to.eq("My Test Plan");
      })

      it('Should only include that custom testPlan value was provided in telemetry', () => {
        // arrange
        util.setInput("testPlan", "My Test Plan");
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testPlan).to.be.undefined;
        expect(telemetry.testPlan_custom).to.be.true;
      });

      it('Should resolve config filter if provided', () => {
        // arrange
        util.setInput("testConfigFilter", "chrome");
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        expect(parameters.testConfigFilter).to.eq("chrome");
      });

      it('Should only include that custom config filter was provided in telemetry', () => {
        // arrange
        util.setInput("testConfigFilter", "chrome");
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testConfigFilter).to.be.undefined;
        expect(telemetry.testConfigFilter_custom).to.be.true;
      });

      it('Should resolve config aliases', () => {
        // arrange
        util.setInput("testConfigAliases", 'ie="Internet Explorer", chrome="Chrome"' + ", lnx='Ubuntu 22.04'");
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        expect(parameters.testConfigAliases.length).to.eq(3);
        expect(parameters.testConfigAliases[0].alias).to.eq("ie");
        expect(parameters.testConfigAliases[0].config).to.eq("Internet Explorer");
        expect(parameters.testConfigAliases[1].alias).to.eq("chrome")
        expect(parameters.testConfigAliases[1].config).to.eq("Chrome")
        expect(parameters.testConfigAliases[2].alias).to.eq("lnx")
        expect(parameters.testConfigAliases[2].config).to.eq("Ubuntu 22.04")
      });

      it('Should only indicate that custom config aliases were provided in telemetry', () => {
        // arrange
        util.setInput("testConfigAliases", 'ie="Internet Explorer", chrome="Chrome"');
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testConfigAliases).to.be.undefined;
        expect(telemetry.testConfigAliases_custom).to.be.true;
      });
    });

    context('default values', () => {

      let expectedCollectionUri : string | undefined;

      before(() => {
        // process.env.SYSTEM_COLLECTIONURI is defined in the mocha test explorer env
        // but is not unloaded using our testUtil. Capture the original value
        expectedCollectionUri = process.env.SYSTEM_COLLECTIONURI;
      });

      afterEach(() => {
        // reset System_CollectionUri to prevent test pollution
        util.setSystemVariable("SYSTEM.COLLECTIONURI", expectedCollectionUri as string);
        util.loadData();
      })

      it('Should resolve default taskParameters for url, project and access token', () => {
        // arrange
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        expect(parameters.collectionUri).to.eq(process.env.SYSTEM_COLLECTIONURI);
        expect(parameters.accessToken).to.eq(accessToken);
        expect(parameters.projectName).to.eq(process.env.TEAMPROJECT);
      });

      it('Should detect when running on Azure DevOps Services in telemetry', () => {
        // arrange
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.serverType).to.be.eq("Hosted");
      });

      it('Should detect when running on Azure DevOps Services (old url) in telemetry', () => {
        // arrange
        util.setSystemVariable("SYSTEM.COLLECTIONURI", "https://myOrg.visualstudio.com");
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.serverType).to.be.eq("Hosted");
      });

      it('Should detect when running on Azure DevOps Server in telemetry', () => {
        // arrange
        util.setSystemVariable("SYSTEM.COLLECTIONURI", "https://myserver.com/tfs/myOrg");
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.serverType).to.be.eq("OnPremises");
      });

      it('Should anonymize url + project name in telemetry', () => {
        // arrange
        util.loadData();

        // act
        var parameters = subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.collectionUri).to.not.equal(parameters.collectionUri)
        expect(telemetry.projectName).to.not.equal(parameters.projectName);
      });

      it('Should not include access token value in telemetry', () => {
        // arrange
        util.loadData();

        // act
        subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.accessToken).to.be.undefined;
      });

      it('Should treat empty testPlan as undefined', () => {
        // arrange
        util.loadData();
        // act
        var parameters = subject.getTestContextParameters();
        // assert
        expect(parameters.testPlan).to.be.undefined;
      });

      it('Should not include details about testPlan in telemetry when not provided', () => {
        // arrange
        util.loadData();
        // act
        subject.getTestContextParameters();
        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testPlan).to.be.undefined;
        expect(telemetry.testPlan_custom).to.be.undefined;
      });

      it('Should not include test config filter in telemetry when not provided', () => {
        // arrange
        util.loadData();

        // act
        subject.getTestContextParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testConfigFilter).to.be.undefined;
        expect(telemetry.testConfigFilter_custom).to.be.undefined;
      });

      it('Should not include details about testConfigAliases in telemetry when not provided', () => {
        // arrange
        util.loadData();
        // act
        subject.getTestContextParameters();
        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testConfigAliases).to.be.undefined;
        expect(telemetry.testConfigAliases_custom).to.be.undefined;
      });
    });

    it('Should record begin and end of context stage in telemetry', () => {
      // arrange
      // mock out the tph to spy on recordStage
      //const tphRecordStage = subject.tph.recordStage;
      let recordedStages: string[] = [];
      subject.tph.recordStage = (stage: string) => {
        recordedStages.push(stage);
        //tphRecordStage.call(subject.tph, stage);
      };
      util.loadData();

      // act
      subject.getTestContextParameters();

      // assert
      expect(recordedStages.length).to.eq(2);
      expect(recordedStages[0]).to.eq("getTestContextParameters");
      expect(recordedStages[1]).to.eq("createContext");
    })

    it('Should record that context stage was reached in telemetry', () => {
      // arrange
      util.loadData();

      // act
      subject.getTestContextParameters();

      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.taskStage).to.eq("createContext");
    });
  });

  context('TestFrameworkParameters', () => {

    var validFiles : string[] = [];
    var invalidFiles : string[] = [];
    var relativeFiles : string[] = [];
    var emptyResults : string
    var basePath : string;

    before(() => {
      basePath = path.join(__dirname, "data");
      validFiles.push( path.join( basePath, "xunit","xunit-1.xml") );
      validFiles.push( path.join( basePath, "xunit","xunit-2.xml") );

      relativeFiles.push( path.join("xunit", "xunit-1.xml") );
      relativeFiles.push( path.join("xunit", "xunit-2.xml") );

      invalidFiles.push( path.join("xunit", "invalidFile1.xml") );

      emptyResults = path.join( basePath, "xunit/empty-results.xml");
    });

    beforeEach(() => {
      util.setSystemVariable("System.DefaultWorkingDirectory", __dirname);
    });

    context('ensure required inputs are provided', () => {

      it('Should require testResultFormat to be provided', () => {
        // arrange
        // leave testResultFormat empty
        util.setInput("testResultFiles", validFiles[0] );
        util.loadData();

        // act / assert
        util.shouldThrow( () => subject.getFrameworkParameters(), "Input required: testResultFormat");
      });

      it('Should require testResultFiles to be provided', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");
        util.loadData();

        // act / assert
        util.shouldThrow( () => subject.getFrameworkParameters(), "Input required: testResultFiles");
      });

    });

    context('get test files', () => {

      it('Should verify that absolute result files are valid', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");     
        util.setInput("testResultFiles", validFiles[0]);
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        expect(parameters.testFormat).to.eq("xunit");
        expect(parameters.testFiles[0]).to.eq(validFiles[0]);
      });

      it('Should allow absolute files to be missing when failTaskOnMissingResultsFile is false', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");     
        util.setInput("testResultFiles", "not-a-valid-file.xml");
        util.setInput("failTaskOnMissingResultsFile", "false");
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        expect(parameters.testFiles.length).to.eq(0);
      });

      it('Should resolve relative paths to working directory', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");
        util.setInput("testResultDirectory", path.join(__dirname)); // assume user supplied $(Pipeline.Workspace)/folder
        util.setInput("testResultFiles", "data/xunit/xunit-1.xml");
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        expect(parameters.testFiles[0]).to.eq(validFiles[0]);
      })

      it('Should use default working directory as base results folder when relative path is provided', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");
        util.setInput("testResultFiles", "data/xunit/xunit-1.xml");
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        expect(parameters.testFiles[0]).to.eq(validFiles[0]);
      })

      it('Should complain if testResultFiles refers to invalid file', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");     
        util.setInput("testResultFiles", invalidFiles[0]);
        util.loadData();
        var messageRegex = new RegExp(`Not found testResultFile\\(s\\): .+invalidFile1.xml`);

        // act / assert
        //require(tp);
        util.shouldThrow( () => subject.getFrameworkParameters(), messageRegex);
      });

      it('Should allow glob paths to be specified', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");
        util.setInput("testResultDirectory", path.join(__dirname)); // assume user supplied $(Pipeline.Workspace)/folder
        util.setInput("testResultFiles","data/xunit/**.xml");
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        expect(parameters.testFormat).to.eq("xunit");
        expect(parameters.testFiles.length).to.eq(1);
        // future: make sure that the glob pattern was resolved
        //expect(parameters.testFiles[0].indexOf("*")).to.eq(-1);
      });

      it('Should allow multiple test result files to be specified', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");     
        util.setInput("testResultFiles", validFiles.join(","));
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        expect(parameters.testFormat).to.eq("xunit");
        expect(parameters.testFiles[0]).to.eq(validFiles[0]);
        expect(parameters.testFiles[1]).to.eq(validFiles[1]);
      });

      it('Should record number of test result files in telemetry', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");
        util.setInput("testResultFiles", validFiles.join(","));
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.numTestFiles).to.eq(2);
      });

      it('Should indiciate that testResultFiles have wildcards in telemetry', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");
        util.setInput("testResultFiles", path.join(__dirname, "data","xunit","**.xml"));
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testResultFilesWildcard).to.be.true;
      });
    });

    context('user supplied values', () => {

      it('Should complain if testResultFormat is not a supported type.', () => {
        // arrange
        util.setInput("testResultFormat","yomamma");
        util.setInput("testResultFiles", validFiles.join(","));
        util.loadData();

        // act / assert
        util.shouldThrow( () => subject.getFrameworkParameters(), /testResultformat 'yomamma' is not supported. Please specify one of the following values: xunit, .*/);
      });

      it('Should allow mixed case on testResultFormat', () => {
        // arrange
        util.setInput("testResultFormat","XuNiT");
        util.setInput("testResultFiles", validFiles.join(","));
        util.loadData();
        
        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        expect(parameters.testFormat).to.eq("xunit");
      });

      it('Should include testResultFormat in telemetry', () => {
        // arrange
        util.setInput("testResultFormat","xUnit");
        util.setInput("testResultFiles", validFiles.join(","));
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testResultFormat).to.eq("xUnit"); // todo: apply transform in telemetry helper to ensure consistent casing?
      });

      it('Should indicate when user has provided value for testResultsDirectory in telemetry', () => {
        // arrange
        util.setInput("testResultDirectory", path.join(__dirname)); // assume user supplied $(Pipeline.Workspace)/folder
        util.setInput("testResultFormat", "xUnit");
        util.setInput("testResultFiles", "data/xunit/xunit-1.xml");
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testResultDirectory).to.be.undefined;
        expect(telemetry.testResultDirectory_custom).to.be.true;
      })

      it('Should indicate when user has provided value for failTaskOnMissingTests in telemetry', () => {
        // arrange
        util.setInput("failTaskOnMissingTests", "true");
        util.setInput("testResultFormat", "xUnit");     
        util.setInput("testResultFiles", validFiles.join(','));
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.failTaskOnMissingTests).to.be.true;
        expect(telemetry.failTaskOnMissingTests_custom).to.be.true;
      });

      it('Should indicate when user has provided opted-out of failTaskOnMissingTests in telemetry', () => {
        // arrange
        util.setInput("failTaskOnMissingTests", "false");
        util.setInput("testResultFormat", "xUnit");     
        util.setInput("testResultFiles", validFiles.join(','));
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.failTaskOnMissingTests).to.be.false;
        expect(telemetry.failTaskOnMissingTests_custom).to.be.true;
      });

      it('Should indicate when user has provided value for failTaskOnMissingResultsFile in telemetry', () => {
        // arrange
        util.setInput("failTaskOnMissingResultsFile", "true");
        util.setInput("testResultFormat", "xUnit");     
        util.setInput("testResultFiles", validFiles.join(','));
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.failTaskOnMissingResultsFile).to.be.true;
        expect(telemetry.failTaskOnMissingResultsFile_custom).to.be.true;
      });

      it('Should indicate when user has provided opted-out of failTaskOnMissingResultsFile in telemetry', () => {
        // arrange
        util.setInput("failTaskOnMissingResultsFile", "false");
        util.setInput("testResultFormat", "xUnit");     
        util.setInput("testResultFiles", validFiles.join(','));
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.failTaskOnMissingResultsFile).to.be.false;
        expect(telemetry.failTaskOnMissingResultsFile_custom).to.be.true;
      });

    });

    context('default values', () => {

      it('Should default failTaskOnMissingResultFiles to true', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");     
        util.setInput("testResultFiles", emptyResults);
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        expect(parameters.failOnMissingResultsFile).to.be.true;
      });

      it('Should default failTaskOnMissingTests to false', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");     
        util.setInput("testResultFiles", emptyResults);
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        expect(parameters.failOnMissingTests).to.be.false;
      });

      it('Should not record a value for failTaskOnMissingTests in telemetry when default is used', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");     
        util.setInput("testResultFiles", emptyResults);
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.failTaskOnMissingTests).to.be.undefined;
        expect(telemetry.failTaskOnMissingTests_custom).to.be.undefined;
      });

      it('Should not record a value for failTaskOnMissingResultsFile in telemetry when default is used', () => {
        // arrange
        util.setInput("testResultFormat", "xUnit");     
        util.setInput("testResultFiles", emptyResults);
        util.loadData();

        // act
        var parameters = subject.getFrameworkParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.failTaskOnMissingResultsFile).to.be.undefined;
        expect(telemetry.failTaskOnMissingResultsFile_custom).to.be.undefined;
      });
    });

    it('Should record begin and end of framework stage in telemetry', () => {
      // arrange
      // mock out the tph to spy on recordStage
      let recordedStages: string[] = [];
      subject.tph.recordStage = (stage: string) => {
        recordedStages.push(stage);
      };
      util.setInput("testResultFormat", "xUnit");     
      util.setInput("testResultFiles", validFiles.join(','));
      util.loadData();

      // act
      subject.getFrameworkParameters();

      // assert
      expect(recordedStages.length).to.eq(2);
      expect(recordedStages[0]).to.eq("getFrameworkParameters");
      expect(recordedStages[1]).to.eq("readFrameworkResults");
    })

    it('Should record that framework stage was reached in telemetry', () => {
      // arrange
      util.setInput("testResultFormat", "xUnit");     
      util.setInput("testResultFiles", validFiles.join(','));
      util.loadData();

      // act
      subject.getFrameworkParameters();

      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.taskStage).to.eq("readFrameworkResults");
    });

  });

  context('TestResultProcessorParameters', () => {

    context('default values', () => {
      it('Should use defaults if no inputs are provided', () => {
        // arrange
        // act
        var result = subject.getProcessorParameters();

        // assert
        expect(result.testConfigFilter).to.be.undefined;
        expect(result.testCaseMatchStrategy).to.eq(TestCaseMatchingStrategy.auto); // TODO: Enum
        expect(result.testCaseProperty).to.be.eq("TestCase");
        expect(result.testCaseRegEx).to.be.eq("(\\d+)");
        expect(result.testConfigProperty).eq("Config");
      });

      it('Should should not record values for processor parameters in telemetry when defaults are used', () => {
        // arrange
        // act
        var result = subject.getProcessorParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testConfigFilter).to.be.undefined;
        expect(telemetry.testConfigFilter_custom).to.be.undefined;
        expect(telemetry.testCaseMatchStrategy).to.be.undefined;
        expect(telemetry.testCaseMatchStrategy_custom).to.be.undefined;
        expect(telemetry.testCaseProperty).to.be.undefined;
        expect(telemetry.testCaseProperty_custom).to.be.undefined;
        expect(telemetry.testCaseRegEx).to.be.undefined;
        expect(telemetry.testCaseRegEx_custom).to.be.undefined;
        expect(telemetry.testConfigProperty).to.be.undefined;
        expect(telemetry.testConfigProperty_custom).to.be.undefined;
      });
    });

    context('user supplied values', () => {
      it('Should recognize testConfigFilter has been applied', () => {
        // arrange
        util.setInput("testConfigFilter", "Default");
        util.loadData();

        // act
        var result = subject.getProcessorParameters();

        // assert
        expect(result.testConfigFilter).to.be.eq("Default");
      });

      it('Should reflect that custom value for testConfigFilter was provided in telemetry', () => {
        // arrange
        util.setInput("testConfigFilter", "Default");
        util.loadData();

        // act
        var result = subject.getProcessorParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testConfigFilter).to.be.undefined; // don't record user's config names
        expect(telemetry.testConfigFilter_custom).to.be.true;
      });

      it('Should support custom regex for testcase name', () => {
        // arrange
        util.setInput("testCaseRegex", "TestCase(\\d+)");
        util.loadData();

        // act
        var result = subject.getProcessorParameters();

        // assert
        expect(result.testCaseRegEx).to.be.eq("TestCase(\\d+)");
      });

      it('Should record custom regex in telemetry when custom value is provided', () => {
        // arrange
        util.setInput("testCaseRegex", "TestCase(\\d+)");
        util.loadData();

        // act
        var result = subject.getProcessorParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testCaseRegex).to.be.eq("TestCase(\\d+)");
        expect(telemetry.testCaseRegex_custom).to.be.true;
      });

      it('Should support custom property for testcase id', () => {
        // arrange
        util.setInput("testCaseProperty", "id");
        util.loadData();

        // act
        var result = subject.getProcessorParameters();

        // assert
        expect(result.testCaseProperty).to.be.eq("id");
      });

      it('Should record custom property for testcase id in telemetry when custom value is provided', () => {
        // arrange
        util.setInput("testCaseProperty", "id");
        util.loadData();

        // act
        var result = subject.getProcessorParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testCaseProperty).to.be.eq("id");
        expect(telemetry.testCaseProperty_custom).to.be.true;
      });

      it('Should support custom property for config name or alias', () => {
        // arrange
        util.setInput("testConfigProperty", "Category");
        util.loadData();

        // act
        var result = subject.getProcessorParameters();

        // assert
        expect(result.testConfigProperty).to.be.eq("Category");
      });

      it('Should record custom config property in telemetry when custom value is provided', () => {
        // arrange
        util.setInput("testConfigProperty", "Category");
        util.loadData();

        // act
        var result = subject.getProcessorParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testConfigProperty).to.be.eq("Category");
        expect(telemetry.testConfigProperty_custom).to.be.true;
      });

      it('Should allow testCaseMatchStrategy to be used as a set of flags', () => {
        // arrange
        util.setInput("testCaseMatchStrategy", "name,property");
        util.loadData();

        // act
        var result = subject.getProcessorParameters();

        // assert
        let final = TestCaseMatchingStrategy.name | TestCaseMatchingStrategy.property;
        expect(result.testCaseMatchStrategy).to.be.eq( final );
      });

      it('Should record testCaseMatchStrategy in telemetry when custom value is provided', () => {
        // arrange
        util.setInput("testCaseMatchStrategy", "name,property");
        util.loadData();

        // act
        var result = subject.getProcessorParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testCaseMatchStrategy).to.be.eq("name,property"); // record actual values, not realized processed values
        expect(telemetry.testCaseMatchStrategy_custom).to.be.true;
      });

      it('Should allow testConfigProperty to find single configuration property', () => {
        // arrange
        util.setInput("testConfigProperty", "config");
        util.loadData();

        // act
        var result = subject.getProcessorParameters();

        // assert
        expect(result.testConfigProperty).to.be.eq( "config" );
      })
    });

    it('Should record begin and end of result processor stage in telemetry', () => {
      // arrange
      // mock out the tph to spy on recordStage
      let recordedStages: string[] = [];
      subject.tph.recordStage = (stage: string) => {
        recordedStages.push(stage);
      };
      
      util.loadData();

      // act
      subject.getProcessorParameters();

      // assert
      expect(recordedStages.length).to.eq(2);
      expect(recordedStages[0]).to.eq("getProcessorParameters");
      expect(recordedStages[1]).to.eq("processFrameworkResults");
    })

    it('Should record that framework stage was reached in telemetry', () => {
      // arrange
      util.loadData();

      // act
      subject.getProcessorParameters();

      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.taskStage).to.eq("processFrameworkResults");
    });
  });

  context('TestRunPublisherParameters', () => {

    beforeEach(() => {
      // test files are used by the TestRunPubliser to include as attachments
      // but they are resolved earlier in getTestFrameworkParameters
      // we can add a static reference here
      subject.testFiles = [ path.join(__dirname, "data", "xunit", "xunit-1.xml") ];
    })

    context('user supplied values', () => {

      it('Should read user-supplied server and accesstoken', () => {
        // arrange
        util.setInput("collectionUri", "https://my");
        util.setInput("accessToken", "myToken")
        util.loadData();

        // act
        var parameters = subject.getPublisherParameters();

        // assert
        expect(parameters.collectionUri).to.eq("https://my");
        expect(parameters.accessToken).to.eq("myToken");
      });

      it("Should default failTaskOnUnmatchedTestCases to true", () => {
        // arrange
        util.loadData();

        // act
        var parameters = subject.getPublisherParameters();

        // assert
        expect(parameters.failTaskOnUnmatchedTestCases).to.be.true;
      });

      it('Should record failTaskOnUnmatchedTestCases in telemetry when custom value is provided', () => {
        // arrange
        util.setInput("failTaskOnUnmatchedTestCases", "false");
        util.loadData();

        // act
        var parameters = subject.getPublisherParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.failTaskOnUnmatchedTestCases).to.be.false;
        expect(telemetry.failTaskOnUnmatchedTestCases_custom).to.be.undefined;
      });

      it("Should allow testRun publishing to be disabled by enabling 'dryRun'", () => {
        // arrange
        util.setInput("dryRun", "true");
        util.loadData();

        // act
        var parameters = subject.getPublisherParameters();

        // assert
        expect(parameters.dryRun).to.be.true;
      });

      it('should record dryRun in telemetry when custom value is provided', () => {
        // arrange
        util.setInput("dryRun", "true");
        util.loadData();

        // act
        var parameters = subject.getPublisherParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.dryRun).to.be.true;
        expect(telemetry.dryRun_custom).to.be.undefined;
      });

      it('should resolve testRunTitle if provided', () => {
        // arrange
        util.setInput("testRunTitle", "My Test Run");
        util.loadData();

        // act
        var parameters = subject.getPublisherParameters();

        // assert
        expect(parameters.testRunTitle).to.eq("My Test Run");
      });

      it('should record testRunTitle in telemetry when custom value is provided', () => {
        // arrange
        util.setInput("testRunTitle", "My Test Run");
        util.loadData();

        // act
        var parameters = subject.getPublisherParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.testRunTitle).to.be.undefined;
        expect(telemetry.testRunTitle_custom).to.be.true;
      });

    });

    context('default values', () => {
      it('Should resolve default values', () => {
        // arrange
        util.loadData();

        // act
        var parameters = subject.getPublisherParameters();

        // assert
        expect(parameters.collectionUri).to.eq(process.env.SYSTEM_COLLECTIONURI as string);
        expect(parameters.accessToken).to.eq(process.env.SYSTEM_ACCESSTOKEN as string);
        expect(parameters.dryRun).to.be.false;
        expect(parameters.testRunTitle).to.eq("PublishTestPlanResult");
      });

      it('Should not record telemetry for default values', () => {
        // arrange
        util.loadData();

        // act
        var parameters = subject.getPublisherParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.dryRun).to.be.undefined;
        expect(telemetry.testRunTitle).to.be.undefined;
      })
    });

    context('For Build Pipeline', () => {

      it('Should resolve build id from build pipeline', () => {
        // arrange
        // BUILD_BUILDID is available in build and classic release pipelines.
        // for release pipelines, if there are multiple build artifacts, the build id is 
        // based on the primary artifact.
        util.setSystemVariable("BUILD_BUILDID", "1234")
        util.loadData();

        // act
        subject = TaskParameters.getInstance(); // reload to pick up values from constructor
        var parameters = subject.getPublisherParameters();

        // assert
        expect(parameters.buildId).to.eq("1234");
      });

      it("Should resolve empty values for release variables if not present", () => {
        // arrange
        util.loadData();

        // act
        subject = TaskParameters.getInstance(); // reload to pick up values from constructor
        var parameters = subject.getPublisherParameters();

        // assert
        expect(parameters.releaseUri).to.be.undefined;
        expect(parameters.releaseEnvironmentUri).to.be.undefined;
      });

    });    

    context("For Release Pipeline", () => {

      it("Should resolve release uri and environment uri from release pipeline", () => {
        // arrange
        util.setSystemVariable("RELEASE_RELEASEURI", "vstfs://ReleaseManagement/Release/1234");
        util.setSystemVariable("RELEASE_ENVIRONMENTURI", "vstfs://ReleaseManagement/Environment/5678");
        util.loadData();

        // act
        subject = TaskParameters.getInstance(); // reload to pick up values from constructor
        var parameters = subject.getPublisherParameters();

        // assert
        expect(parameters.releaseUri).to.satisfy( (x: string) => x.startsWith("vstfs://ReleaseManagement"));
        expect(parameters.releaseEnvironmentUri).to.satisfy( (x: string) => x.startsWith("vstfs://ReleaseManagement"));
      });
    });
    
    it('Should record begin and end of testrun publishing stage in telemetry', () => {
      // arrange
      // mock out the tph to spy on recordStage
      let recordedStages: string[] = [];
      subject.tph.recordStage = (stage: string) => {
        recordedStages.push(stage);
      };
      util.loadData();

      // act
      subject.getPublisherParameters();

      // assert
      expect(recordedStages.length).to.eq(2);
      expect(recordedStages[0]).to.eq("getPublisherParameters");
      expect(recordedStages[1]).to.eq("publishTestRunResults");
    })

    it('Should record that testrun publishing stage was reached in telemetry', () => {
      // arrange
      util.loadData();

      // act
      subject.getPublisherParameters();

      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.taskStage).to.eq("publishTestRunResults");
    });
  });

  context('TelemetryPublisherParameters', () => {

    it('Should include telemetry payload', () => {
      // arrange
      // act
      var parameters = subject.getTelemetryParameters();
      // assert
      expect(parameters.payload).to.not.be.undefined;
    });

    it('Should include feature flags in payload', () => {
      // arrange
      util.setFeatureFlag(FeatureFlag.DisplayTelemetry, "true");
      util.setFeatureFlag(FeatureFlag.DisplayTelemetryErrors, "true");
      util.loadData();
      // act
      var parameters = subject.getTelemetryParameters();
      // assert
      expect(parameters.payload.flags).to.have.lengthOf(2);
    });

    context(`FeatureFlag: ${FeatureFlag.PublishTelemetry}`, () =>  {

      it(`should populate ${FeatureFlag.PublishTelemetry} from FeatureFlag`, () => {
        // arrange
        util.setFeatureFlag(FeatureFlag.PublishTelemetry, "true");
        util.loadData();

        // act
        var parameters = subject.getTelemetryParameters();

        // assert
        expect(parameters.publishTelemetry).to.be.true;
      });

      it(`should default ${FeatureFlag.PublishTelemetry} to false`, () => {
        // arrange
        util.loadData();
        // act
        var parameters = subject.getTelemetryParameters();
        // assert
        expect(parameters.publishTelemetry).to.be.false;
      });
    });

    context(`FeatureFlag: ${FeatureFlag.DisplayTelemetry}`, () =>  {

      it(`should populate ${FeatureFlag.DisplayTelemetry} from FeatureFlag`, () => {
        // arrange
        util.setFeatureFlag(FeatureFlag.DisplayTelemetry, "true");
        util.loadData();

        // act
        var parameters = subject.getTelemetryParameters();

        // assert
        expect(parameters.displayTelemetryPayload).to.be.true;
      });

      it(`should default ${FeatureFlag.DisplayTelemetry} to false`, () => {
        // arrange
        util.loadData();
        // act
        var parameters = subject.getTelemetryParameters();
        // assert
        expect(parameters.displayTelemetryPayload).to.be.false;
      });

    });
    
    context(`FeatureFlag: ${FeatureFlag.DisplayTelemetryErrors}`, () =>  {

      it(`should populate ${FeatureFlag.DisplayTelemetryErrors} from FeatureFlag`, () => {
        // arrange
        util.setFeatureFlag(FeatureFlag.DisplayTelemetryErrors, "true");
        util.loadData();

        // act
        var parameters = subject.getTelemetryParameters();

        // assert
        expect(parameters.displayTelemetryErrors).to.be.true;
      });

      it(`should default ${FeatureFlag.DisplayTelemetryErrors} to false`, () => {
        // arrange
        util.loadData();
        // act
        var parameters = subject.getTelemetryParameters();
        // assert
        expect(parameters.displayTelemetryErrors).to.be.false;
      });

    });

    context('When error is provided', () => {
      it('Should populate telemetry payload with error (typed)', () => {
        // arrange
        let error : Error;
        try {
          throw new Error("Something bad happened");
        }
        catch (err: any) {
          error = (err as Error);
        }
        // act
        const parameters = subject.getTelemetryParameters(error);
        // assert
        expect(parameters.payload.errorMessage).to.eq("Something bad happened");
        expect(parameters.payload.errorStack).to.not.be.undefined;
      });

      it('Should populate telemetry payload with error (untyped)', () => {
        // arrange
        const error = { message: "Something bad happened", code: 500 };
        // act
        const parameters = subject.getTelemetryParameters(error);
        // assert
        expect(parameters.payload.errorMessage).to.eq(JSON.stringify(error));
        expect(parameters.payload.errorStack).to.be.undefined;
      });
    });
  });

  context('StatusFilterParameters', () => {

    context('default values', () => {
      it('Should use defaults if no inputs are provided', () => {
        // arrange
        // act
        var parameters = subject.getStatusFilterParameters();

        // assert
        expect(parameters.failTaskOnFailedTests).to.be.false;
        expect(parameters.failTaskOnSkippedTests).to.be.false;
      });

      it('should not record values for status filter parameters in telemetry when defaults are used', () => {
        // arrange
        // act
        var parameters = subject.getStatusFilterParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.failTaskOnFailedTests).to.be.undefined;
        expect(telemetry.failTaskOnFailedTests_custom).to.be.undefined;
        expect(telemetry.failTaskOnSkippedTests).to.be.undefined;
        expect(telemetry.failTaskOnSkippedTests_custom).to.be.undefined;
      });
    });
    
    context('user supplied values', () => {
      it('Should resolve failTaskOnFailedTests input', () => {
        // arrange
        util.setInput("failTaskOnFailedTests", "true");
        util.loadData();

        // act
        var parameters = subject.getStatusFilterParameters();

        // assert
        expect(parameters.failTaskOnFailedTests).to.be.true;
      });

      it('should record failTaskOnFailedTests in telemetry when custom value is provided', () => {
        // arrange
        util.setInput("failTaskOnFailedTests", "true");
        util.loadData();

        // act
        var parameters = subject.getStatusFilterParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.failTaskOnFailedTests).to.be.true;
        expect(telemetry.failTaskOnFailedTests_custom).to.be.undefined;
      });

      it('should record failTaskOnFailedTests in telemetry when custom value is provided (false)', () => {
        // arrange
        util.setInput("failTaskOnFailedTests", "false");
        util.loadData();

        // act
        var parameters = subject.getStatusFilterParameters();

        // assert
        let telemetry = subject.getTelemetryParameters().payload;
        expect(telemetry.failTaskOnFailedTests).to.be.false;
        expect(telemetry.failTaskOnFailedTests_custom).to.be.undefined;
      });

      it('Should resolve failTaskOnSkippedTests input', () => {
        // arrange
        util.setInput("failTaskOnSkippedTests", "true");
        util.loadData();

        // act
        var parameters = subject.getStatusFilterParameters();

        // assert
        expect(parameters.failTaskOnSkippedTests).to.be.true;
      });
    });
    

    it('should record failTaskOnSkippedTests in telemetry when custom value is provided', () => {
      // arrange
      util.setInput("failTaskOnSkippedTests", "true");
      util.loadData();

      // act
      var parameters = subject.getStatusFilterParameters();

      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.failTaskOnSkippedTests).to.be.true;
      expect(telemetry.failTaskOnSkippedTests_custom).to.be.undefined;
    });

    it('should record failTaskOnSkippedTests in telemetry when custom value is provided (false)', () => {
      // arrange
      util.setInput("failTaskOnSkippedTests", "false");
      util.loadData();

      // act
      var parameters = subject.getStatusFilterParameters();

      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.failTaskOnSkippedTests).to.be.false;
      expect(telemetry.failTaskOnSkippedTests_custom).to.be.undefined;
    });

    it('Should record begin and end of status filter stage in telemetry', () => {
      // arrange
      // mock out the tph to spy on recordStage
      let recordedStages: string[] = [];
      subject.tph.recordStage = (stage: string) => {
        recordedStages.push(stage);
      };
      util.loadData();

      // act
      subject.getStatusFilterParameters();

      // assert
      expect(recordedStages.length).to.eq(2);
      expect(recordedStages[0]).to.eq("getStatusFilterParameters");
      expect(recordedStages[1]).to.eq("finalizeResults");
    })

    it('Should record that status filter stage was reached in telemetry', () => {
      // arrange
      util.loadData();

      // act
      subject.getStatusFilterParameters();

      // assert
      let telemetry = subject.getTelemetryParameters().payload;
      expect(telemetry.taskStage).to.eq("finalizeResults");
    });    
  });
});

