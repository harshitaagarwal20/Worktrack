-- AlterTable: replace TransportMode enum values
ALTER TABLE `travel_reimbursements`
  MODIFY COLUMN `transportMode` ENUM('BIKE', 'SCOOTY', 'AUTO', 'CAB') NULL;
