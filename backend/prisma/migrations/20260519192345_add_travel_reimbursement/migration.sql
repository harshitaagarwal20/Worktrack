-- CreateTable
CREATE TABLE `travel_reimbursements` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `travelDate` DATE NOT NULL,
    `clientName` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `ratePerKm` DOUBLE NOT NULL,
    `kilometers` DOUBLE NOT NULL,
    `amount` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvalRemark` VARCHAR(191) NULL,
    `payrollId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `travel_reimbursements_employeeId_idx`(`employeeId`),
    INDEX `travel_reimbursements_travelDate_idx`(`travelDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `travel_reimbursements` ADD CONSTRAINT `travel_reimbursements_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `travel_reimbursements` ADD CONSTRAINT `travel_reimbursements_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `travel_reimbursements` ADD CONSTRAINT `travel_reimbursements_payrollId_fkey` FOREIGN KEY (`payrollId`) REFERENCES `payrolls`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
