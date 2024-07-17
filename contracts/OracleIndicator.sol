// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract OracleIndicator is AccessControl {
    bytes32 public constant READ_ONLY = keccak256("READ_ONLY");
    uint8 private decimals;
    string private name;

    struct DataFeed {
        int256 value;
        uint256 updatedat;
        uint8 decimal;
        uint8 confidence;
    }

    uint256 constant PRECISION = 1e8;
    mapping(uint256 => DataFeed) public indicators;
    DataFeed private lastIndicator;

    constructor(string memory _name, uint8 _decimals, address _defaultAdmin) {
        decimals = _decimals;
        name = _name;
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
    }

    function saveIndicator(
        uint256 _timestamp,
        int256 _value,
        uint256 _updatedat,
        uint8 _confidence
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 dayStartTimestamp = _timestamp - (_timestamp % 86400); // Arredonda _updatedat para o início do dia (00:00:00)
        lastIndicator = DataFeed({
            value: _value,
            updatedat: _updatedat,
            decimal: decimals,
            confidence: _confidence
        });
        indicators[dayStartTimestamp] = lastIndicator;
    }

    function getLast() external view onlyRole(READ_ONLY) returns (DataFeed memory) {
        return lastIndicator;
    }

    function getDate(
        uint256 _timestamp
    ) external view onlyRole(READ_ONLY) returns (DataFeed memory) {
        uint256 dayStartTimestamp = _timestamp - (_timestamp % 86400); // Arredonda _timestamp para o início do dia (00:00:00)
        return indicators[dayStartTimestamp];
    }

    function getInterval(
        uint256 _start,
        uint256 _end
    ) external view onlyRole(READ_ONLY) returns (int256) {
        uint256 startDayTimestamp = _start - (_start % 86400); // Arredonda _start para o início do dia (00:00:00)
        uint256 endDayTimestamp = _end - (_end % 86400); // Arredonda _end para o início do dia (00:00:00)

        uint256 productValue = PRECISION;
        for (uint256 i = startDayTimestamp; i <= endDayTimestamp; i += 86400) {
            if (indicators[i].value >= 0) {
                productValue = Math.mulDiv(
                    productValue,
                    uint256(indicators[i].value),
                    PRECISION
                );
            }
        }

        return int256(productValue);
    }

    function decimal() external view returns (uint8) {
        return decimals;
    }

    function getName() external view returns (string memory) {
        return name;
    }
}