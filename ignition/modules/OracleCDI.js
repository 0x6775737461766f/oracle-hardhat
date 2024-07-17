const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("OracleModule", (m) => { 

    const name = m.getParameter("name", "CDI Diário");
    const decimals = m.getParameter("decimals", 6);
    const owner = m.getAccount(0); 
    
    const oracle = m.contract("OracleIndicator", [name, decimals, owner], { 
        from: owner, 
    }); 

    return { oracle }; 
});