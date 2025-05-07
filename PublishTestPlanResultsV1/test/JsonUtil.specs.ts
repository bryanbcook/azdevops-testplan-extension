import { expect } from "chai";
import sinon from "sinon";
import path from "path";
import * as Contracts from 'azure-devops-node-api/interfaces/TestInterfaces'
import { TestFrameworkResult } from "../framework/TestFrameworkResult";
import { JSONStringify } from "../services/JsonUtil";



describe("JSONUtil", () => {

  let resultItem: TestFrameworkResult

  beforeEach(() => {
    resultItem = new TestFrameworkResult("TestName", "PASS")
    resultItem.duration = 1234.5678
    resultItem.stacktrace = "stacktrace"
    resultItem.failure = "failure"
  });

  it("Can stringify test framework result", () => {
    // arrange
    // act
    const result = JSONStringify(resultItem);

    // assert
    expect(result).to.contain('"name":"TestName"');
    expect(result).to.contain('"duration":1234.5678');
    expect(result).to.contain('"stacktrace":"stacktrace"');
    expect(result).to.contain('"failure":"failure"');
    expect(result).to.contain('"outcome":2');
    expect(result).to.contain('"properties":{}');
    expect(result).to.contain('"attachments":[]');
  });

  it("Can stringify test framework result with properties", () => {
    // arrange
    resultItem.properties.set("TestID", "1234")
    resultItem.properties.set("TestConfig", "edge")

    // act
    const result = JSONStringify(resultItem);

    // assert
    expect(result).to.contain('"properties":{"TestID":"1234","TestConfig":"edge"}');
  });

  it("Can stringify test framework result with attachments", () => {
    // arrange
    resultItem.attachments.push({ name: "TestAttachment", path: "filepath1" })
    resultItem.attachments.push({ name: "TestAttachment2", path: "filepath2" })

    // act
    const result = JSONStringify(resultItem);

    // assert
    expect(result).to.contain('"attachments":[{"name":"TestAttachment","path":"filepath1"},{"name":"TestAttachment2","path":"filepath2"}]');
  });

});