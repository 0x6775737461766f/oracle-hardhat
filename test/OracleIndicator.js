const { expect } = require("chai");
const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("OracleIndicator", function () {

    async function deployOracleIndicatorFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const name = "CDI Diario";
        const decimals = 6;

        const OracleIndicator = await ethers.getContractFactory("OracleIndicator");
        const oracle = await OracleIndicator.deploy(name, decimals, owner.address);
        
        return { oracle, owner, addr1, addr2 };
    }

    describe ("Setup", function () {
        it("Should set the admin role", async function () {
            const {oracle, owner} = await loadFixture(deployOracleIndicatorFixture);

            const admin = await oracle.DEFAULT_ADMIN_ROLE();

            expect(await oracle.hasRole(admin, owner.address)).to.be.true;
        })

        it("Should allow granting READ_ONLY role", async function () {
            const {oracle, addr1} = await loadFixture(deployOracleIndicatorFixture);

            const readOnlyRole = await oracle.READ_ONLY();
            await oracle.grantRole(readOnlyRole, addr1.address);

            expect(await oracle.hasRole(readOnlyRole, addr1.address)).to.be.true;
        })

        it("Should prevent non-admins from granting READ_ONLY role", async function () {
            const {oracle, addr1, addr2} = await loadFixture(deployOracleIndicatorFixture);

            const readOnlyRole = await oracle.READ_ONLY();

            await expect(oracle.connect(addr1).grantRole(readOnlyRole, addr2.address)).to.be.reverted;
        })
    })

    describe("Transactions", function () {
        it("Should save and get last indicator correctly", async function () {
            const { oracle, owner } = await loadFixture(deployOracleIndicatorFixture);

            const readOnlyRole = await oracle.READ_ONLY();
            await oracle.grantRole(readOnlyRole, owner.address);

            const timestamp = Math.floor(Date.now() / 1000);
            await oracle.connect(owner).saveIndicator(timestamp, 100, timestamp, 1);
            
            const lastIndicator = await oracle.getLast();
            const lastDate = await oracle.getDate(timestamp);

            expect(lastDate.value).to.equal(lastIndicator.value);
            expect(lastIndicator.value).to.equal(100);
            expect(lastIndicator.updatedat).to.equal(timestamp);
            expect(lastIndicator.confidence).to.equal(1);
          })
    })
});
