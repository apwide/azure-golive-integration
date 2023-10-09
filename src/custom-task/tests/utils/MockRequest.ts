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

  public defaults(options: any) {
    return this;
  }

  public async post(request) {
    console.log("Mock answer of this POST:", request);
    if (request.url.includes("/environments/search/paginated")) {
      return {environments: this.foundEnvironments};
    }
    if (request.url.includes("/application")) {
      return this.createdApplication;
    }
    if (request.url.includes("/category")) {
      return this.createdCategory;
    }
    if (request.url.includes("/environment")) {
      return this.createdEnvironment;
    }
  }

  public async put(request) {
    console.log("Mock answer of this PUT:", request);
    if (request.url.includes("/status-change?environmentId=")) {
      return this.updatedEnvironmentStatus;
    }
    if (request.url.includes("/environment/")) {
      return this.updatedEnvironment;
    }
    if (request.url.includes("/deployment?environmentId=")) {
      return this.updatedDeployment;
    }
  }

  public async get(request) {
    console.log("Mock answer of this GET:", request);
    if (request.url.includes("/environments/search/paginated")) {
      return JSON.stringify({environments: this.foundEnvironments});
    }
    if (request.url.includes("/applications")) {
      return JSON.stringify(this.foundApplications);
    }
    if (request.url.includes("/categories")) {
      return JSON.stringify(this.foundCategories);
    }
  }

}
