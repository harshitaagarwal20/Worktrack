-- Create admin user: Nidhi Mittal
SET @userId = UUID();
SET @employeeId = UUID();

INSERT INTO `users` (`id`, `email`, `password`, `role`, `createdAt`, `updatedAt`)
VALUES (
    @userId,
    'nidhi83mittal@gmail.com',
    '$2b$10$1BHw6bG4h/.Jk8Od2jAGkezDNI.bNASUCGli2F8O6./5lgtPiQWfe',
    'HR_ADMIN',
    NOW(),
    NOW()
);

INSERT INTO `employees` (`id`, `userId`, `employeeCode`, `firstName`, `lastName`, `dateOfJoining`, `designation`, `monthlySalary`, `isActive`, `worksSundays`)
VALUES (
    @employeeId,
    @userId,
    'EMP001',
    'Nidhi',
    'Mittal',
    NOW(),
    'HR Admin',
    0,
    true,
    false
);
