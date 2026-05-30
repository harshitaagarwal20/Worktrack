-- WorkTrack Database Schema
-- Run this file to create all tables from scratch

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'HR_ADMIN', 'DEPARTMENT_HEAD') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `employeeCode` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `dateOfJoining` DATETIME(3) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `monthlySalary` DOUBLE NOT NULL,
    `managerId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `worksSundays` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `employees_userId_key`(`userId`),
    UNIQUE INDEX `employees_employeeCode_key`(`employeeCode`),
    INDEX `employees_employeeCode_idx`(`employeeCode`),
    INDEX `employees_managerId_idx`(`managerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'HALF_DAY', 'WORK_FROM_HOME', 'LEAVE') NULL,
    `checkIn` DATETIME(3) NULL,
    `checkOut` DATETIME(3) NULL,
    `location` VARCHAR(191) NULL,
    `locationAddress` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `workHours` DOUBLE NULL,
    `remarks` VARCHAR(191) NULL,
    `approvalStatus` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attendances_employeeId_idx`(`employeeId`),
    INDEX `attendances_date_idx`(`date`),
    UNIQUE INDEX `attendances_employeeId_date_key`(`employeeId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_reports` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `workingHours` DOUBLE NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `work_reports_employeeId_idx`(`employeeId`),
    INDEX `work_reports_date_idx`(`date`),
    UNIQUE INDEX `work_reports_employeeId_date_key`(`employeeId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_report_entries` (
    `id` VARCHAR(191) NOT NULL,
    `workReportId` VARCHAR(191) NOT NULL,
    `clientName` VARCHAR(191) NULL,
    `tasksCompleted` TEXT NOT NULL,

    INDEX `work_report_entries_workReportId_idx`(`workReportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `holidays` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `isPaid` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `holidays_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payrolls` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `totalWorkingDays` INTEGER NOT NULL,
    `presentDays` DOUBLE NOT NULL,
    `absentDays` DOUBLE NOT NULL,
    `halfDays` DOUBLE NOT NULL,
    `paidHolidays` INTEGER NOT NULL,
    `unpaidHolidays` INTEGER NOT NULL,
    `approvedLeaves` INTEGER NOT NULL,
    `grossSalary` DOUBLE NOT NULL,
    `totalDeductions` DOUBLE NOT NULL,
    `manualAdjustment` DOUBLE NOT NULL DEFAULT 0,
    `adjustmentRemark` VARCHAR(191) NULL,
    `netSalary` DOUBLE NOT NULL,
    `status` ENUM('DRAFT', 'FINALIZED', 'PAID') NOT NULL DEFAULT 'DRAFT',
    `generatedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payrolls_employeeId_idx`(`employeeId`),
    INDEX `payrolls_month_year_idx`(`month`, `year`),
    UNIQUE INDEX `payrolls_employeeId_month_year_key`(`employeeId`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_items` (
    `id` VARCHAR(191) NOT NULL,
    `payrollId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `type` ENUM('EARNING', 'DEDUCTION') NOT NULL,
    `amount` DOUBLE NOT NULL,

    INDEX `payroll_items_payrollId_idx`(`payrollId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_requests` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `fromDate` DATE NOT NULL,
    `toDate` DATE NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `leave_requests_employeeId_idx`(`employeeId`),
    INDEX `leave_requests_fromDate_toDate_idx`(`fromDate`, `toDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `transportMode` ENUM('BIKE', 'SCOOTY', 'AUTO', 'CAB', 'CAR', 'TRAIN', 'AIRPLANE') NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvalRemark` VARCHAR(191) NULL,
    `payrollId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `travel_reimbursements_employeeId_idx`(`employeeId`),
    INDEX `travel_reimbursements_travelDate_idx`(`travelDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `outstation_claims` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `fromDate` DATE NOT NULL,
    `toDate` DATE NOT NULL,
    `destination` VARCHAR(191) NOT NULL,
    `purpose` TEXT NOT NULL,
    `transportMode` ENUM('BIKE', 'SCOOTY', 'AUTO', 'CAB', 'CAR', 'TRAIN', 'AIRPLANE') NULL,
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

-- Foreign Keys
ALTER TABLE `employees` ADD CONSTRAINT `employees_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `employees` ADD CONSTRAINT `employees_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `attendances` ADD CONSTRAINT `attendances_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `work_reports` ADD CONSTRAINT `work_reports_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `work_reports` ADD CONSTRAINT `work_reports_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `work_report_entries` ADD CONSTRAINT `work_report_entries_workReportId_fkey` FOREIGN KEY (`workReportId`) REFERENCES `work_reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_generatedBy_fkey` FOREIGN KEY (`generatedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `payroll_items` ADD CONSTRAINT `payroll_items_payrollId_fkey` FOREIGN KEY (`payrollId`) REFERENCES `payrolls`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `travel_reimbursements` ADD CONSTRAINT `travel_reimbursements_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `travel_reimbursements` ADD CONSTRAINT `travel_reimbursements_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `travel_reimbursements` ADD CONSTRAINT `travel_reimbursements_payrollId_fkey` FOREIGN KEY (`payrollId`) REFERENCES `payrolls`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `outstation_claims` ADD CONSTRAINT `outstation_claims_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `outstation_claims` ADD CONSTRAINT `outstation_claims_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
