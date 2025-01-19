import { TestOutcome } from 'azure-devops-node-api/interfaces/TestInterfaces';
import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs';
import { TestFrameworkParameters } from '../framework/TestFrameworkParameters';
import * as TestFrameworkResultReader from '../framework/TestFrameworkResultReader';

describe("TestFramework Results Reader", () => {

  var baseDir : string;
  var files : string[];

  before(() => {
    baseDir = path.join(__dirname, "data");
  })

  beforeEach(() => {
    files = [];
  })

  it("Can read xUnit results", async () => {
    // arrange
    files.push(path.join(baseDir, "xunit/xunit-1.xml"));
    var parameters = new TestFrameworkParameters(files, "xunit");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.eq(1);
    expect(String(results[0].properties.get("TestID"))).to.equal('1234');
    expect(results[0].properties.get("TestLevel")).to.equal('Regression');
    expect(results[0].properties.get("TestProduct")).to.equal('TestProductExample');
  });

  // https://github.com/bryanbcook/azdevops-testplan-extension/issues/48
  it("Can read xUnit time", async () => {
    // arrange
    files.push(path.join(baseDir, "xunit/xunit-1.xml"));
    var parameters = new TestFrameworkParameters(files, "xunit");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results[0].duration).to.eq(86006.5);
  });
 
 
  it("Can read jUnit results", async () => {
    // arrange
    files.push(path.join(baseDir, "junit/single-suite.xml"));
    var parameters = new TestFrameworkParameters(files, "junit");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.eq(1);
  });

  // https://github.com/bryanbcook/azdevops-testplan-extension/issues/31
  it("Can read JUnit test outcomes", async () => {
    // arrange
    files.push(path.join(baseDir, "junit/test-cleansed.xml"));
    var parameters = new TestFrameworkParameters(files, "junit");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results[0].outcome).to.eq(TestOutcome.NotExecuted);
    expect(results[1].outcome).to.eq(TestOutcome.Failed);
    expect(results[2].outcome).to.eq(TestOutcome.Passed);
    expect(results[3].outcome).to.eq(TestOutcome.NotExecuted);
    expect(results[4].outcome).to.eq(TestOutcome.Failed);
  });

  // https://github.com/bryanbcook/azdevops-testplan-extension/issues/48
  it("Can read JUnit time", async () => {
    // arrange
    files.push(path.join(baseDir, "junit/single-suite.xml"));
    var parameters = new TestFrameworkParameters(files, "junit");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results[0].duration).to.eq(10000);
  });

  it("Can read Cucumber results", async () => {
    // arrange
    files.push(path.join(baseDir, "cucumber/single-suite-single-test.json"));
    var parameters = new TestFrameworkParameters(files, "cucumber");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.eq(1);
  });

  it("Can read Mocha results", async () => {
    // arrange
    files.push(path.join(baseDir, "mocha/single-suite-single-test.json"));
    var parameters = new TestFrameworkParameters(files, "mocha");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.eq(1);
  });

  it("Can read NUnit results", async () => {
    // arrange
    files.push(path.join(baseDir, "nunit/nunit_v3.xml"));
    var parameters = new TestFrameworkParameters(files, "nunit");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.be.greaterThan(0);
  });

  it("Can read NUnit results (with attachments)", async () => {
    // arrange
    // adjust file paths in xml to match this environments to
    // emulate that the xml result files were generated on this environment
    let file = path.join(baseDir, "nunit/nunit_v3_attachments.xml");
    await fixLocalPaths(file);
    
    files.push(file);
    var parameters = new TestFrameworkParameters(files, "nunit");

    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results[0].attachments.length).to.be.greaterThan(0);
  })

  it("Can read NUnit results (with missing attachments)", async () => {
    // arrange
    // adjust file paths in xml to match this environments to
    // emulate that the xml result files were generated on this environment
    let file = path.join(baseDir, "nunit/nunit_v3_attachments_missing.xml");
    await fixLocalPaths(file);
    
    files.push(file);
    var parameters = new TestFrameworkParameters(files, "nunit");

    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.be.eq(1); // results should be present
    expect(results[0].attachments.length).to.be.eq(0); // missing attachments should not.
  })

  it("Can read TestNG results", async () => {
    // arrange
    files.push(path.join(baseDir, "testng/single-suite.xml"));
    var parameters = new TestFrameworkParameters(files, "testng");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.be.greaterThan(1);
  });

  it("Can read MStests results", async () => {
    // arrange
    files.push(path.join(baseDir, "mstest", "testresults.trx"));
    var parameters = new TestFrameworkParameters(files, "mstest");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.eq(10);
  });

  it("Can read MStest results (with attachments)", async () => {
    // arrange
    files.push(path.join(baseDir, "mstest", "testresults_with_attachments.trx"));
    var parameters = new TestFrameworkParameters(files, "mstest");

    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.eq(2);
    expect(results[0].attachments.length).to.be.greaterThan(0);
  })

  async function fixLocalPaths(file: string) {
    let repositoryRoot = path.join(__dirname, "..", "..");
    let pathToChange = "C:\\dev\\code\\_Personal\\testplan-extension";
    let buffer = await fs.promises.readFile(file);
    let data = buffer.toString().replaceAll(pathToChange, repositoryRoot);
    await fs.promises.writeFile(file, data);
  }
})