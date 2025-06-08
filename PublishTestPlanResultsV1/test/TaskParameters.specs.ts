import { expect } from 'chai';
import * as path from 'path';
import { TestCaseMatchingStrategy } from '../processing/TestResultMatchStrategy';
import * as TaskParameters from '../TaskParameters';
import * as util from './testUtil';

describe('TaskParameters', () => {

  var tp: any;
  var accessToken: string;

  beforeEach(() => {
    //
    tp = path.join(__dirname, '..', 'TaskParameters.js');
    util.clearData();

    accessToken = (process.env.SYSTEM_ACCESSTOKEN ?? process.env.ENDPOINT_AUTH_PARAMETER_SYSTEMVSSCONNECTION_ACCESSTOKEN) as string;

    util.setSystemVariable("System.CollectionUri", process.env.SYSTEM_COLLECTIONURI as string);
    util.setSystemVariable("System.AccessToken", process.env.SYSTEM_ACCESSTOKEN as string);
    util.setSystemVariable("ENDPOINT_AUTH_PARAMETER_SYSTEMVSSCONNECTION_ACCESSTOKEN", process.env.SYSTEM_ACCESSTOKEN as string);
    util.setSystemVariable("System.TeamProject", process.env.TEAMPROJECT as string);
  });

  afterEach(() => {
    util.clearData();
  });

  context('TestResultContextParameters', () => {

    it('Should use user-supplied values if provided', () => {
      // arrange
      util.setInput("collectionUri", "https://my");
      util.setInput("projectName", "myProject");
      util.setInput("accessToken", "myToken")
      util.loadData();

      // act
      require(tp);

      var parameters = TaskParameters.getTestContextParameters();

      // assert
      expect(parameters.collectionUri).to.eq("https://my");
      expect(parameters.accessToken).to.eq("myToken");
      expect(parameters.projectName).to.eq("myProject");
    });

    it('Should resolve default taskParameters', () => {
      // arrange
      util.loadData();

      // act
      require(tp);

      var parameters = TaskParameters.getTestContextParameters();

      // assert
      expect(parameters.collectionUri).to.eq(process.env.SYSTEM_COLLECTIONURI as string);
      expect(parameters.accessToken).to.eq(accessToken);
      expect(parameters.projectName).to.eq(process.env.TEAMPROJECT as string);
    });

    it('Should resolve config aliases', () => {
      // arrange
      util.setInput("testConfigAliases", 'ie="Internet Explorer", chrome="Chrome"' + ", lnx='Ubuntu 22.04'");
      util.loadData();

      // act
      require(tp);
      var parameters = TaskParameters.getTestContextParameters();

      // assert
      expect(parameters.testConfigAliases.length).to.eq(3);
      expect(parameters.testConfigAliases[0].alias).to.eq("ie");
      expect(parameters.testConfigAliases[0].config).to.eq("Internet Explorer");
      expect(parameters.testConfigAliases[1].alias).to.eq("chrome")
      expect(parameters.testConfigAliases[1].config).to.eq("Chrome")
      expect(parameters.testConfigAliases[2].alias).to.eq("lnx")
      expect(parameters.testConfigAliases[2].config).to.eq("Ubuntu 22.04")
    });
  });

  context('TestFrameworkParameters', () => {

    var validFiles : string[] = [];
    var invalidFiles : string[] = [];

    before(() => {
      var basePath = path.join(__dirname, "data");
      validFiles.push( path.join( basePath, "xunit","xunit-1.xml") );
      validFiles.push( path.join( basePath, "xunit","xunit-2.xml") );

      invalidFiles.push( path.join("xunit", "invalidFile1.xml") );
    });

    beforeEach(() => {
      util.setSystemVariable("System.DefaultWorkingDirectory", __dirname);
    })

    it('Should require testResultFormat to be provided', () => {
      // arrange
      // leave testResultFormat empty
      util.setInput("testResultFiles", validFiles[0] );
      util.loadData();

      // act
      require(tp);

      // assert
      util.shouldThrow( () => TaskParameters.getFrameworkParameters(), "Input required: testResultFormat");
    });

    it('Should require testResultFiles to be provided', () => {
      // arrange
      util.setInput("testResultFormat", "xUnit");
      util.loadData();

      // act
      require(tp);

      // assert
      util.shouldThrow( () => TaskParameters.getFrameworkParameters(), "Input required: testResultFiles");
    });

    it('Should verify that absolute result files are valid', () => {
      // arrange
      util.setInput("testResultFormat", "xUnit");     
      util.setInput("testResultFiles", validFiles[0]);
      util.loadData();

      // act
      require(tp);
      var parameters = TaskParameters.getFrameworkParameters();

      // assert
      expect(parameters.testFormat).to.eq("xunit");
      expect(parameters.testFiles[0]).to.eq(validFiles[0]);
    });

    it('Should resolve relative paths to working directory', () => {
      // arrange
      util.setInput("testResultFormat", "xUnit");
      util.setInput("testResultDirectory", path.join(__dirname)); // assume user supplied $(Pipeline.Workspace)/folder
      util.setInput("testResultFiles", "data/xunit/xunit-1.xml");
      util.loadData();

      // act
      require(tp);
      var parameters = TaskParameters.getFrameworkParameters();

      // assert
      expect(parameters.testFiles[0]).to.eq(validFiles[0]);
    })

    it('Should use default working directory as base results folder when relative path is provided', () => {
      // arrange
      util.setInput("testResultFormat", "xUnit");
      util.setInput("testResultFiles", "data/xunit/xunit-1.xml");
      util.loadData();

      // act
      require(tp);
      var parameters = TaskParameters.getFrameworkParameters();

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
      require(tp);
      util.shouldThrow( () => TaskParameters.getFrameworkParameters(), messageRegex);
    });

    it('Should allow glob paths to be specified', () => {
      // arrange
      util.setInput("testResultFormat", "xUnit");
      util.setInput("testResultDirectory", path.join(__dirname)); // assume user supplied $(Pipeline.Workspace)/folder
      util.setInput("testResultFiles","data/xunit/**.xml");
      util.loadData();

      // act
      require(tp);
      var parameters = TaskParameters.getFrameworkParameters();

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
      require(tp);
      var parameters = TaskParameters.getFrameworkParameters();

      // assert
      expect(parameters.testFormat).to.eq("xunit");
      expect(parameters.testFiles[0]).to.eq(validFiles[0]);
      expect(parameters.testFiles[1]).to.eq(validFiles[1]);
    });

    it('Should complain if testResultFormat is not a supported type.', () => {
      // arrange
      util.setInput("testResultFormat","yomamma");
      util.setInput("testResultFiles", validFiles.join(","));
      util.loadData();

      // act / assert
      util.shouldThrow( () => TaskParameters.getFrameworkParameters(), /testResultformat 'yomamma' is not supported. Please specify one of the following values: xunit, .*/);
    })

    it('Should allow mixed case on testResultFormat', () => {
      // arrange
      util.setInput("testResultFormat","XuNiT");
      util.setInput("testResultFiles", validFiles.join(","));
      util.loadData();
      
      // act
      require(tp);
      var parameters = TaskParameters.getFrameworkParameters();

      // assert
      expect(parameters.testFormat).to.eq("xunit");
    })

  });

  context('TestResultProcessorParameters', () => {

    it('Should use defaults if no inputs are provided', () => {
      // arrange
      // act
      require(tp);
      var result = TaskParameters.getProcessorParameters();

      // assert
      expect(result.testConfigFilter).to.be.undefined;
      expect(result.testCaseMatchStrategy).to.eq(TestCaseMatchingStrategy.auto); // TODO: Enum
      expect(result.testCaseProperty).to.be.eq("TestCase");
      expect(result.testCaseRegEx).to.be.eq("(\\d+)");
      expect(result.testConfigProperty).eq("Config");
    });

    it('Should recognize testConfigFilter has been applied', () => {
      // arrange
      util.setInput("testConfigFilter", "Default");
      util.loadData();

      // act
      require(tp);
      var result = TaskParameters.getProcessorParameters();

      // assert
      expect(result.testConfigFilter).not.to.be.undefined;
    });

    it('Should support custom regex for testcase name', () => {
      // arrange
      util.setInput("testCaseRegex", "TestCase(\\d+)");
      util.loadData();

      // act
      require(tp);
      var result = TaskParameters.getProcessorParameters();

      // assert
      expect(result.testCaseRegEx).to.be.eq("TestCase(\\d+)");
    });

    it('Should support custom property for testcase id', () => {
      // arrange
      util.setInput("testCaseProperty", "id");
      util.loadData();

      // act
      require(tp);
      var result = TaskParameters.getProcessorParameters();

      // assert
      expect(result.testCaseProperty).to.be.eq("id");
    });

    it('Should support custom property for config name or alias', () => {
      // arrange
      util.setInput("testConfigProperty", "Category");
      util.loadData();

      // act
      require(tp);
      var result = TaskParameters.getProcessorParameters();

      // assert
      expect(result.testConfigProperty).to.be.eq("Category");
    });

    it('Should allow testCaseMatchStrategy to be used as a set of flags', () => {
      // arrange
      util.setInput("testCaseMatchStrategy", "name,property");
      util.loadData();

      // act
      require(tp);
      var result = TaskParameters.getProcessorParameters();

      // assert
      let final = TestCaseMatchingStrategy.name | TestCaseMatchingStrategy.property;
      expect(result.testCaseMatchStrategy).to.be.eq( final );
    });

    it('Should allow testConfigProperty to find single configuration property', () => {
      // arrange
      util.setInput("testConfigProperty", "config");
      util.loadData();

      // act
      require(tp);
      var result = TaskParameters.getProcessorParameters();

      // assert
      expect(result.testConfigProperty).to.be.eq( "config" );
    })
  });

  context('TestRunPublisherParameters', () => {
    it('Should read user-supplied server and accesstoken', () => {
      // arrange
      util.setInput("collectionUri", "https://my");
      util.setInput("accessToken", "myToken")
      util.setInput("testResultFiles", path.join(__dirname, "data", "xunit", "xunit-1.xml"));
      util.loadData();

      // act
      require(tp);
      var parameters = TaskParameters.getPublisherParameters();

      // assert
      expect(parameters.collectionUri).to.eq("https://my");
      expect(parameters.accessToken).to.eq("myToken");
    })

    it('Should resolve default values', () => {
      // arrange
      util.setInput("testResultFiles", path.join(__dirname, "data", "xunit", "xunit-1.xml"));
      util.loadData();

      // act
      require(tp);
      var parameters = TaskParameters.getPublisherParameters();

      // assert
      expect(parameters.collectionUri).to.eq(process.env.SYSTEM_COLLECTIONURI as string);
      expect(parameters.accessToken).to.eq(process.env.SYSTEM_ACCESSTOKEN as string);
      expect(parameters.dryRun).to.be.false;
      expect(parameters.testRunTitle).to.eq("PublishTestPlanResult");
    });

    it('Should resolve build id from build pipeline', () => {
      // arrange
      util.setInput("testResultFiles", path.join(__dirname, "data", "xunit", "xunit-1.xml"));
      // BUILD_BUILDID is available in build and classic release pipelines.
      // for release pipelines, if there are multiple build artifacts, the build id is 
      // based on the primary artifact.
      util.setSystemVariable("BUILD_BUILDID", "1234")
      util.loadData();

      // act
      require(tp);
      var parameters = TaskParameters.getPublisherParameters();

      // assert
      expect(parameters.buildId).to.eq("1234");
    })

    it("Should allow testRun publishing to be disabled by enabling 'dryRun'", () => {
      // arrange
      util.setInput("testResultFiles", path.join(__dirname, "data", "xunit", "xunit-1.xml"));
      util.setInput("dryRun", "true");
      util.loadData();

      // act
      require(tp);
      var parameters = TaskParameters.getPublisherParameters();

      // assert
      expect(parameters.dryRun).to.be.true;
    })

    it("Should resolve empty values for release variables if not present", () => {
      // arrange
      util.setInput("testResultFiles", path.join(__dirname, "data", "xunit", "xunit-1.xml"));
      util.loadData();

      // act
      require(tp);
      var parameters = TaskParameters.getPublisherParameters();

      // assert
      expect(parameters.releaseUri).to.be.undefined;
      expect(parameters.releaseEnvironmentUri).to.be.undefined;
    })

    context("For Release Pipeline", () => {

      it("Should resolve release uri and environment uri from release pipeline", () => {
        // arrange
        util.setInput("testResultFiles", path.join(__dirname, "data", "xunit", "xunit-1.xml"));
        util.setSystemVariable("RELEASE_RELEASEURI", "vstfs://ReleaseManagement/Release/1234");
        util.setSystemVariable("RELEASE_ENVIRONMENTURI", "vstfs://ReleaseManagement/Environment/5678");
        util.loadData();

        // act
        require(tp);
        var parameters = TaskParameters.getPublisherParameters();

        // assert
        expect(parameters.releaseUri).to.satisfy( (x: string) => x.startsWith("vstfs://ReleaseManagement"));
        expect(parameters.releaseEnvironmentUri).to.satisfy( (x: string) => x.startsWith("vstfs://ReleaseManagement"));
      });
    })
  });

});

