import * as path from 'path';
import { expect } from 'chai';
import { TestFrameworkParameters } from '../framework/TestFrameworkParameters';
import * as TestFrameworkResultReader from '../framework/TestFrameworkResultReader';

describe("TestFramework Results Reader", () => {

  context("xUnit", () => {

    var baseDir : string;

    before(() => {
      baseDir = path.join(__dirname, "data");
    })

    it("Can read xUnit results", async () => {
      // arrange
      var files = [];
      files.push(path.join(baseDir, "xunit", "xunit-1.xml"));
      var parameters = new TestFrameworkParameters(files, "xUnit");
      
      // act
      var results = await TestFrameworkResultReader.readResults(parameters);

      // assert
      expect(results.length).to.eq(1);
    });

  });

  // context("jUnit", () => {

  //   it("Can read jUnit results", () => {
  //     throw new Error("Not implemented");
  //   });

  // })
})