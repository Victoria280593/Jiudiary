SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'[dbo].[Users]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Users', N'LastLoginAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[Users]
        ADD [LastLoginAt] DATETIME2 NULL;
END;

IF OBJECT_ID(N'[dbo].[Users]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Users', N'LastPasswordChangedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[Users]
        ADD [LastPasswordChangedAt] DATETIME2 NULL;
END;

COMMIT TRANSACTION;
