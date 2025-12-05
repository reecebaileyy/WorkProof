// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PaymentSplitter
 * @notice Splits USDC payments 50/50 between student and platform
 * @dev Used by x402 protocol to split payments from recruiter agents
 */
contract PaymentSplitter is Ownable, ReentrancyGuard {
    /// @notice USDC token address (Base Sepolia)
    IERC20 public usdc;
    
    /// @notice Platform wallet address (receives 50%)
    address public platformWallet;
    
    /// @notice Mapping from student address to their share of payments
    mapping(address => uint256) public studentBalances;
    
    /// @notice Total platform balance
    uint256 public platformBalance;

    /// @notice Emitted when payment is split
    event PaymentSplit(
        address indexed payer,
        address indexed student,
        uint256 studentAmount,
        uint256 platformAmount,
        uint256 totalAmount
    );

    /// @notice Emitted when student withdraws their balance
    event StudentWithdrawal(address indexed student, uint256 amount);

    /// @notice Emitted when platform withdraws balance
    event PlatformWithdrawal(address indexed platform, uint256 amount);

    /**
     * @notice Constructor
     * @param _usdc USDC token address on Base Sepolia
     * @param _platformWallet Platform wallet address (receives 50% of payments)
     * @param initialOwner Owner of the contract (can update platform wallet)
     */
    constructor(
        address _usdc,
        address _platformWallet,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_usdc != address(0), "PaymentSplitter: USDC address cannot be zero");
        require(_platformWallet != address(0), "PaymentSplitter: platform wallet cannot be zero");
        
        usdc = IERC20(_usdc);
        platformWallet = _platformWallet;
    }

    /**
     * @notice Update platform wallet address (only owner)
     * @param _platformWallet New platform wallet address
     */
    function setPlatformWallet(address _platformWallet) external onlyOwner {
        require(_platformWallet != address(0), "PaymentSplitter: platform wallet cannot be zero");
        platformWallet = _platformWallet;
    }

    /**
     * @notice Split a payment 50/50 between student and platform
     * @param student Student address to receive 50% of payment
     * @param amount Total payment amount in USDC (6 decimals)
     * @dev Called by x402 middleware or directly by payers
     */
    function splitPayment(address student, uint256 amount) external nonReentrant {
        require(student != address(0), "PaymentSplitter: student address cannot be zero");
        require(amount > 0, "PaymentSplitter: amount must be greater than 0");
        
        // Transfer USDC from caller to this contract
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "PaymentSplitter: USDC transfer failed"
        );
        
        // Calculate 50/50 split
        uint256 studentAmount = amount / 2;
        uint256 platformAmount = amount - studentAmount; // Handle odd amounts
        
        // Update balances
        studentBalances[student] += studentAmount;
        platformBalance += platformAmount;
        
        emit PaymentSplit(msg.sender, student, studentAmount, platformAmount, amount);
    }

    /**
     * @notice Withdraw student's accumulated balance
     * @dev Students can call this to claim their share of payments
     */
    function withdrawStudent() external nonReentrant {
        uint256 amount = studentBalances[msg.sender];
        require(amount > 0, "PaymentSplitter: no balance to withdraw");
        
        studentBalances[msg.sender] = 0;
        
        require(
            usdc.transfer(msg.sender, amount),
            "PaymentSplitter: USDC transfer failed"
        );
        
        emit StudentWithdrawal(msg.sender, amount);
    }

    /**
     * @notice Withdraw platform's accumulated balance (only owner)
     */
    function withdrawPlatform() external onlyOwner nonReentrant {
        uint256 amount = platformBalance;
        require(amount > 0, "PaymentSplitter: no platform balance to withdraw");
        
        platformBalance = 0;
        
        require(
            usdc.transfer(platformWallet, amount),
            "PaymentSplitter: USDC transfer failed"
        );
        
        emit PlatformWithdrawal(platformWallet, amount);
    }

    /**
     * @notice Get student's current balance
     * @param student Student address
     * @return balance Current balance in USDC
     */
    function getStudentBalance(address student) external view returns (uint256) {
        return studentBalances[student];
    }
}

