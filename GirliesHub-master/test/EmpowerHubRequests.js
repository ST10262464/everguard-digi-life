const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EmpowerHubRequests", function () {
  let empowerHubRequests;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    
    const EmpowerHubRequests = await ethers.getContractFactory("EmpowerHubRequests");
    empowerHubRequests = await EmpowerHubRequests.deploy();
  });

  it("Should store a request", async function () {
    const requestHash = "QmTestHash123456789";
    const requestType = "finance";
    
    await empowerHubRequests.storeRequest(requestHash, requestType);
    
    const requests = await empowerHubRequests.getRequests();
    expect(requests.length).to.equal(1);
    expect(requests[0].requestHash).to.equal(requestHash);
    expect(requests[0].requestType).to.equal(requestType);
    expect(requests[0].requester).to.equal(owner.address);
  });

  it("Should emit RequestStored event", async function () {
    const requestHash = "QmTestHash123456789";
    const requestType = "gbv";
    
    await expect(empowerHubRequests.storeRequest(requestHash, requestType))
      .to.emit(empowerHubRequests, "RequestStored");
  });

  it("Should track user requests", async function () {
    const requestHash = "QmTestHash123456789";
    const requestType = "sanitary";
    
    await empowerHubRequests.storeRequest(requestHash, requestType);
    
    const userRequests = await empowerHubRequests.getUserRequests(owner.address);
    expect(userRequests.length).to.equal(1);
    expect(userRequests[0]).to.equal(0);
  });
});
