// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TalentPaymentGateway
 * @dev Split-payment contract for x402 Autonomous Payment Agent flow
 * Receives 5 USDC, splits 50/50 between talent and platform
 */
contract TalentPaymentGateway is Ownable {
    // ============ State Variables ============
    IERC20 public immutable usdc;
    uint256 public constant ACCESS_PRICE = 5_000_000; // 5 USDC (6 decimals)
    uint256 public constant PLATFORM_SHARE = 2_500_000; // 2.5 USDC (50% of ACCESS_PRICE)
    uint256 public constant TALENT_SHARE = 2_500_000; // 2.5 USDC (50% of ACCESS_PRICE)

    // ============ Events ============
    event AccessPaid(
        address indexed payer,
        address indexed student,
        uint256 timestamp
    );
    event PlatformFeesWithdrawn(address indexed owner, uint256 amount);

    // ============ Constructor ============
    constructor(address initialOwner, address _usdc) Ownable(initialOwner) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    // ============ Public Functions ============

    /**
     * @dev Pay for access to talent contact information
     * @param targetTalent The resume wallet address of the talent
     * Transfers 5 USDC from caller, splits 50/50 between talent and contract
     */
    function payForAccess(address targetTalent) external {
        require(targetTalent != address(0), "Invalid talent address");
        require(
            usdc.allowance(msg.sender, address(this)) >= ACCESS_PRICE,
            "Insufficient USDC allowance"
        );
        require(
            usdc.balanceOf(msg.sender) >= ACCESS_PRICE,
            "Insufficient USDC balance"
        );

        // Transfer 5 USDC from caller to this contract
        require(
            usdc.transferFrom(msg.sender, address(this), ACCESS_PRICE),
            "USDC transfer failed"
        );

        // Transfer 2.5 USDC to the talent
        require(
            usdc.transfer(targetTalent, TALENT_SHARE),
            "USDC transfer to talent failed"
        );

        // Remaining 2.5 USDC stays in contract (platform fees)

        emit AccessPaid(msg.sender, targetTalent, block.timestamp);
    }

    /**
     * @dev Owner can withdraw accumulated platform fees
     */
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");

        require(usdc.transfer(owner(), balance), "USDC transfer failed");
        emit PlatformFeesWithdrawn(owner(), balance);
    }

    /**
     * @dev Get current platform fee balance
     */
    function getPlatformFeeBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}

