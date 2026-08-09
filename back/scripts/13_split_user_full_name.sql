SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.Users', N'FirstName') IS NULL
   AND COL_LENGTH(N'dbo.Users', N'Name') IS NOT NULL
BEGIN
    EXEC sp_rename N'dbo.Users.Name', N'FirstName', N'COLUMN';
END;

IF COL_LENGTH(N'dbo.Users', N'LastName') IS NULL
BEGIN
    ALTER TABLE [dbo].[Users]
        ADD [LastName] NVARCHAR(200) NOT NULL
            CONSTRAINT [DF_Users_LastName] DEFAULT N'';
END;

IF COL_LENGTH(N'dbo.Users', N'MiddleName') IS NULL
BEGIN
    ALTER TABLE [dbo].[Users]
        ADD [MiddleName] NVARCHAR(200) NULL;
END;

COMMIT TRANSACTION;
