export class MockRequest {

  public foundEnvironments: any[];
  public foundApplications: any[];
  public foundCategories: any[];

  public createdApplication: any;
  public createdCategory: any;
  public createdEnvironment: any;

  public updatedEnvironmentStatus: any;

  public updatedEnvironment: any;

  public updatedDeployment: any;

  public async post(request) {
    console.log("Mock answer of this POST:", request);
    if (request.url.endsWith("/environments/search/paginated")) {
      return {environments: this.foundEnvironments};
    }
    if (request.url.endsWith("/application")) {
      return this.createdApplication;
    }
    if (request.url.endsWith("/category")) {
      return this.createdCategory;
    }
    if (request.url.endsWith("/environment")) {
      return this.createdEnvironment;
    }
  }

  public async put(request) {
    console.log("Mock answer of this PUT:", request);
    if (request.url.indexOf("/status-change?environmentId=") > 0) {
      return this.updatedEnvironmentStatus;
    }
    if (request.url.indexOf("/environment/") > 0) {
      return this.updatedEnvironment;
    }
    if (request.url.indexOf("/deployment?environmentId=") > 0) {
      return this.updatedDeployment;
    }
  }

  public async get(request) {
    console.log("Mock answer of this GET:", request);
    if (request.url.endsWith("/environments/search/paginated")) {
      return JSON.stringify({environments: this.foundEnvironments});
    }
    if (request.url.endsWith("/applications")) {
      return JSON.stringify(this.foundApplications);
    }
    if (request.url.endsWith("/categories")) {
      return JSON.stringify(this.foundCategories);
    }
  }

}
