-- CreateTable
CREATE TABLE `outstation_claims` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `fromDate` DATE NOT NULL,
    `toDate` DATE NOT NULL,
    `destination` VARCHAR(191) NOT NULL,
    `purpose` TEXT NOT NULL,
    `transportMode` ENUM('BIKE', 'SCOOTY', 'AUTO', 'CAB') NULL,
    `travelExpense` DOUBLE NOT NULL DEFAULT 0,
    `foodExpense` DOUBLE NOT NULL DEFAULT 0,
    `accommodationExpense` DOUBLE NOT NULL DEFAULT 0,
    `otherExpense` DOUBLE NOT NULL DEFAULT 0,
    `otherExpenseNote` VARCHAR(191) NULL,
    `totalAmount` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvalRemark` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `outstation_claims_employeeId_idx`(`employeeId`),
    INDEX `outstation_claims_fromDate_idx`(`fromDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `outstation_claims` ADD CONSTRAINT `outstation_claims_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `outstation_claims` ADD CONSTRAINT `outstation_claims_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
