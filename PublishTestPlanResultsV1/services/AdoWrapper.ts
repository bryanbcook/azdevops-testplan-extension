
import { TestConfiguration, TestPlan, TestPoint } from "azure-devops-node-api/interfaces/TestInterfaces";

export class AdoWrapper {

  constructor(server: string, accessToken: string) {
  }

  async getProjectId(projectName: string): Promise<string> {
    throw new Error("Not implemented");
  }

  async getTestPlans(projectName: string): Promise<TestPlan[]> {
    throw new Error("Not implemented");
  }

  async getTestConfigurations(projectName: string): Promise<TestConfiguration[]> {
    throw new Error("Not implemented");
  }

  getTestSuitesForPlan() {
    throw new Error("Not implemented");
  }

  async getTestPointsForSuite(testPlanId : string, testSuiteId : string, recursive : boolean = false) : Promise<TestPoint[]> {
    throw new Error("Not implemented");
  }
}