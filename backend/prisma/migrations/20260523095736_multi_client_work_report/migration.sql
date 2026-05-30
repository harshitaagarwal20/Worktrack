/*
  Warnings:

  - You are about to drop the column `departmentId` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `applicableTo` on the `holidays` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `holidays` table. All the data in the column will be lost.
  - You are about to drop the column `tasksCompleted` on the `work_reports` table. All the data in the column will be lost.
  - You are about to drop the `departments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salary_rules` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `monthlySalary` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `employees` DROP FOREIGN KEY `employees_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `holidays` DROP FOREIGN KEY `holidays_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `salary_rules` DROP FOREIGN KEY `salary_rules_employeeId_fkey`;

-- AlterTable
ALTER TABLE `attendances` ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `locationAddress` VARCHAR(191) NULL,
    ADD COLUMN `longitude` DOUBLE NULL,
    ADD COLUMN `workHours` DOUBLE NULL,
    MODIFY `status` ENUM('PRESENT', 'ABSENT', 'HALF_DAY', 'WORK_FROM_HOME', 'LEAVE') NULL;

-- AlterTable
ALTER TABLE `employees` DROP COLUMN `departmentId`,
    ADD COLUMN `managerId` VARCHAR(191) NULL,
    ADD COLUMN `monthlySalary` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `holidays` DROP COLUMN `applicableTo`,
    DROP COLUMN `departmentId`;

-- AlterTable
ALTER TABLE `outstation_claims` MODIFY `transportMode` ENUM('BIKE', 'SCOOTY', 'AUTO', 'CAB', 'CAR', 'TRAIN', 'AIRPLANE') NULL;

-- AlterTable
ALTER TABLE `travel_reimbursements` MODIFY `transportMode` ENUM('BIKE', 'SCOOTY', 'AUTO', 'CAB', 'CAR', 'TRAIN', 'AIRPLANE') NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('EMPLOYEE', 'HR_ADMIN', 'DEPARTMENT_HEAD') NOT NULL DEFAULT 'EMPLOYEE';

-- AlterTable
ALTER TABLE `work_reports` DROP COLUMN `tasksCompleted`;

-- DropTable
DROP TABLE `departments`;

-- DropTable
DROP TABLE `salary_rules`;

-- CreateTable
CREATE TABLE `work_report_entries` (
    `id` VARCHAR(191) NOT NULL,
    `workReportId` VARCHAR(191) NOT NULL,
    `clientName` VARCHAR(191) NULL,
    `tasksCompleted` TEXT NOT NULL,

    INDEX `work_report_entries_workReportId_idx`(`workReportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `employees_managerId_idx` ON `employees`(`managerId`);

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_report_entries` ADD CONSTRAINT `work_report_entries_workReportId_fkey` FOREIGN KEY (`workReportId`) REFERENCES `work_reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
