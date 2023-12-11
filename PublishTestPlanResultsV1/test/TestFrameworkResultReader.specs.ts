import * as path from 'path';
import { expect } from 'chai';
import { TestFrameworkParameters } from '../framework/TestFrameworkParameters';
import * as TestFrameworkResultReader from '../framework/TestFrameworkResultReader';

describe("TestFramework Results Reader", () => {

  var baseDir : string;

  before(() => {
    baseDir = path.join(__dirname, "data");
  })

  it("Can read xUnit results", async () => {
    // arrange
    var files = [];
    files.push(path.join(baseDir, "xunit", "xunit-1.xml"));
    var parameters = new TestFrameworkParameters(files, "xunit");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.eq(1);
  });
 
 
  it("Can read jUnit results", async () => {
    // arrange
    var files = [];
    files.push(path.join(baseDir, "junit", "single-suite.xml"));
    var parameters = new TestFrameworkParameters(files, "junit");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.eq(1);
  });

  it("Can read Cucumber results", async () => {
    // arrange
    var files = [];
    files.push(path.join(baseDir, "cucumber", "single-suite-single-test.json"));
    var parameters = new TestFrameworkParameters(files, "cucumber");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.eq(1);
  });

  it("Can read Mocha results", async () => {
    // arrange
    var files = [];
    files.push(path.join(baseDir, "mocha", "single-suite-single-test.json"));
    var parameters = new TestFrameworkParameters(files, "mocha");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.eq(1);
  });

  it("Can read NUnit results", async () => {
    // arrange
    var files = [];
    files.push(path.join(baseDir, "nunit", "nunit_v3.xml"));
    var parameters = new TestFrameworkParameters(files, "nunit");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.be.greaterThan(0);
  });

  it("Can read TestNG results", async () => {
    // arrange
    var files = [];
    files.push(path.join(baseDir, "testng", "single-suite.xml"));
    var parameters = new TestFrameworkParameters(files, "testng");
    
    // act
    var results = await TestFrameworkResultReader.readResults(parameters);

    // assert
    expect(results.length).to.be.greaterThan(1);
  });


  // waiting for 0.1.7 that includes this
  // it("Can read MStests results", async () => {
  //   // arrange
  //   var files = [];
  //   files.push(path.join(baseDir, "mstest", "testresults.trx"));
  //   var parameters = new TestFrameworkParameters(files, "mstest");
    
  //   // act
  //   var results = await TestFrameworkResultReader.readResults(parameters);

  //   // assert
  //   expect(results.length).to.eq(1);
  // });


})