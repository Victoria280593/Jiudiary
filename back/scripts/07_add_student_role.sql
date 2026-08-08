SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Id] = 3 AND [Name] <> N'Student')
    THROW 50001, 'Role Id 3 is already assigned to another role.', 1;

IF EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = N'Student' AND [Id] <> 3)
    THROW 50002, 'Role Student already exists with another Id.', 1;

IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Id] = 3 AND [Name] = N'Student')
BEGIN
    INSERT INTO [dbo].[Roles] ([Id], [Name])
    VALUES (3, N'Student');
END;

COMMIT TRANSACTION;
