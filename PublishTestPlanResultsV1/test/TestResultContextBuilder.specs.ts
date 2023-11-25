import { expect } from 'chai';
import * as sinon from 'sinon';
import * as testUtil from './testUtil';
import { newShallowReference, newTestConfig, newTestPlan, newTestPoint } from './testUtil';
import { TestPlan, TestConfiguration, TestPoint, ShallowReference, WorkItemReference } from 'azure-devops-node-api/interfaces/TestInterfaces';
import { AdoWrapper } from '../services/AdoWrapper';
import { ILogger, NullLogger } from '../services/Logger';
import { TestResultContextBuilder } from '../context/TestResultContextBuilder';
import { configAlias } from '../context/configAlias';


describe("TestResultContextBuilder", () => {

  var logger : ILogger
  var ado : sinon.SinonStubbedInstance<AdoWrapper>;
  var subject : TestResultContextBuilder;

  beforeEach(() => {
    logger = new NullLogger();
    ado = sinon.createStubInstance(AdoWrapper);
    subject = new TestResultContextBuilder(logger, ado);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("Should complain if the project name is invalid", async () => {
    // arrange
    ado.getProjectId.throws(new Error("Not found"));
    subject.projectName = "dummy";

    // act
    testUtil.shouldThrowAsync(async () => { return subject.build()}, "Could not resolve project name 'dummy'. Error: Not found");
  });

  context("Test Plan was not specified", () => {

    beforeEach(() => {
      setupProject("1234");
      setupTestPoints([]); // dummy
    })

    it("Should complain if there are no test plans", async () => {
      // arrange
      setupTestPlans([] /*none available*/);

      // act/assert
      testUtil.shouldThrowAsync(async () => { return subject.build()}, "No TestPlans found.");
    });

    it("Should complain if there are multiple test plans that aren't active", async () => {
      // arrange
      setupTestPlans([
        newTestPlan(1), // no enddate
        newTestPlan(2)  // no enddate
        ]);

      // act/assert
      testUtil.shouldThrowAsync( async () => { return subject.build()}, "Unable to infer active test plan.");
    });
    
    it("Should use the first test plan if there is only one", async () => {
      // arrange
      setupTestPlans([
        newTestPlan(1, "Test Plan 1")
      ]);

      // act
      var result = await subject.build();

      // assert
      expect(result.testPlan.name).to.eq("Test Plan 1");
    });
    
    it("Should take the currently active test plan if there is one", async () => {
      // arrange
      let newDate = new Date(Date.now() + 100000);
      let oldDate = new Date(Date.now() - 100000);
      setupTestPlans([
        newTestPlan(1, "Test Plan 1 - old", oldDate),
        newTestPlan(1, "Test Plan 2 - sprint 2", oldDate),
        newTestPlan(1, "Test Plan 2 - current", newDate),
        newTestPlan(1, "Test Plan 2b - retired", oldDate),
      ]);

      // act
      var result = await subject.build();

      // assert
      expect(result.testPlan.name).to.eq("Test Plan 2 - current");
    });
    
    it("Should complain if there are no active test plans", async () => {
      // arrange
      let oldDate = new Date(Date.now() - 100000);
      setupTestPlans([
        newTestPlan(1, "Test Plan 1", oldDate),
        newTestPlan(1, "Test Plan 2", oldDate),
      ]);

      // act
      testUtil.shouldThrowAsync(async () => { return subject.build()}, "Unable to infer active test plan.");
    });
  });
  
  context("TestPlan name was specified", () => {

    beforeEach(() => {
      setupProject("1234");
      setupTestPoints([]); // dummy
    })

    it("Should complain if the testplan doesn't exist", async () => {
      // arrange
      subject.testPlanName = "Not a valid Plan";
      setupTestPlans([
        newTestPlan(1, "Plan 1"),
        newTestPlan(1, "Plan 2")
      ]);

      // assert/act
      testUtil.shouldThrowAsync(async () => { return subject.build()}, "TestPlan 'Not a valid Plan' was not found.");
    });
  });
  
  context("Configuration", () => {
    beforeEach(() => {
      setupTestPlans([
        newTestPlan(1, "ValidPlan")
      ]);
      setupTestPoints([]); // we don't care about points in this test
    })

    it("Should load available test configurations", async () => {
      // arrange
      setupTestConfigurations([
        newTestConfig(1, "Default Configuration")
      ]);
      
      // act
      var result = await subject.build();
  
      // assert
      expect(ado.getTestConfigurations.called).to.eq(true);
      expect(result.hasConfig("1")).to.eq(true);
      expect(result.hasConfig("Default Configuration")).to.eq(true);
    });
    
    it("Should add aliases for known configurations", async () => {
      // arrange
      setupTestConfigurations([
        newTestConfig(1, "Google Chrome")
      ])
      subject.testConfigAlises = [ 
        new configAlias("chrome", "Google Chrome"),
        new configAlias("webkit", "Google Chrome")
      ]
  
      // act
      var result = await subject.build();
  
      // assert
      expect(result.hasConfig("chrome")).to.eq(true);
      expect(result.hasConfig("webkit")).to.eq(true);
    });
  
    it("Should recognize invalid config aliases", async () => {
      // arrange
      setupTestConfigurations([
        newTestConfig(1, "The Only Valid Config")
      ]);
      subject.testConfigAlises = [
        new configAlias("desired", "Not a valid config")
      ];

      // act / assert
      testUtil.shouldThrowAsync( async () => { return subject.build()}, "Unrecognized config name 'Not a valid config'. Please verify that you have the correct configuration aliases defined.");
    });
  })

  context("Load Test Points", () => {

    beforeEach(() => {
      setupProject("1234");
      setupTestPlans([
        newTestPlan(1, "ValidPlan")
      ]);
      setupTestConfigurations([
        newTestConfig(1, "The Only Valid Config")
      ]);
    })

    context("testConfigFilter is specifed", () => {
      it("Should only load test points for that config", async () => {
        // arrange
        setupTestConfigurations([
          newTestConfig(1, "Config 1"),
          newTestConfig(2, "Config 2")
        ]);
        setupTestPoints([
          newTestPoint(1, "Test Case 1", "1"),
          newTestPoint(2, "Test Case 2", "2"),
          newTestPoint(3, "Test Case 3", "2"),
          newTestPoint(4, "Test Case 4", "1"),
        ])
        subject.testConfig = "Config 1"; // set the filter
        
        // act
        var result = await subject.build();

        // assert
        let points = result.getTestPoints();
        expect(points.length).to.eq(2);
        expect(points[0].testCase.name).to.eq("Test Case 1");
        expect(points[1].testCase.name).to.eq("Test Case 4");
      });

      it("Should recognize when test config filter is not a valid config", async () =>{
        // arrange
        setupTestConfigurations([
          newTestConfig(1, "Config 1"),
          newTestConfig(2, "Config 2")
        ]);
        subject.testConfig = "Config 3";

        // act / assert
        testUtil.shouldThrowAsync(async () => { return subject.build()}, "Test config filter refers to an unrecognized configuration 'Config 3'.")
      })
    });
    
    context("testConfigFilter is not specifed", () => {
      it("Should load all test points", async () => {
        // arrange
        setupTestConfigurations([
          newTestConfig(1, "Config 1"),
          newTestConfig(2, "Config 2")
        ]);
        setupTestPoints([
          newTestPoint(1, "Test Case 1", "1"),
          newTestPoint(2, "Test Case 2", "2"),
          newTestPoint(3, "Test Case 3", "2"),
          newTestPoint(4, "Test Case 4", "1"),
        ])
        // no config filter
        
        // act
        var result = await subject.build();

        // assert
        let points = result.getTestPoints();
        expect(points.length).to.eq(4);
        expect(points[0].testCase.name).to.eq("Test Case 1");
        expect(points[1].testCase.name).to.eq("Test Case 2");
        expect(points[2].testCase.name).to.eq("Test Case 3");
        expect(points[3].testCase.name).to.eq("Test Case 4");
      });
    });
  })  

  function setupProject(projectId : string) {
    ado.getProjectId.returns(new Promise((resolve) => {
      resolve(projectId); 
    }));
  }
  
  function setupTestPlans(plans : TestPlan[]) {
    ado.getTestPlans.returns(new Promise((resolve) => { 
      resolve(plans);
    }));
  }

  function setupTestPoints(points : TestPoint[]) {
    ado.getTestPointsForSuite.returns(new Promise((resolve) => {
      resolve(points);
    }));
  }  

  function setupTestConfigurations(configs : TestConfiguration[]) {
    ado.getTestConfigurations.returns(new Promise((resolve) => {
      resolve(configs);
    }));
  }

  
});