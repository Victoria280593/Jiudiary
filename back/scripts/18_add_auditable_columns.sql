SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'[dbo].[Users]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Users', N'CreatedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[Users]
        ADD [CreatedAt] DATETIME2 NOT NULL
            CONSTRAINT [DF_Users_CreatedAt] DEFAULT SYSDATETIME();
END;

IF OBJECT_ID(N'[dbo].[Users]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Users', N'UpdatedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[Users]
        ADD [UpdatedAt] DATETIME2 NULL;
END;

IF OBJECT_ID(N'[dbo].[ClientInfo]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ClientInfo', N'CreatedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[ClientInfo]
        ADD [CreatedAt] DATETIME2 NOT NULL
            CONSTRAINT [DF_ClientInfo_CreatedAt] DEFAULT SYSDATETIME();
END;

IF OBJECT_ID(N'[dbo].[ClientInfo]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ClientInfo', N'UpdatedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[ClientInfo]
        ADD [UpdatedAt] DATETIME2 NULL;
END;

IF OBJECT_ID(N'[dbo].[ClientBelts]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ClientBelts', N'CreatedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[ClientBelts]
        ADD [CreatedAt] DATETIME2 NOT NULL
            CONSTRAINT [DF_ClientBelts_CreatedAt] DEFAULT SYSDATETIME();
END;

IF OBJECT_ID(N'[dbo].[ClientBelts]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ClientBelts', N'UpdatedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[ClientBelts]
        ADD [UpdatedAt] DATETIME2 NULL;
END;

IF OBJECT_ID(N'[dbo].[ClientTrainings]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ClientTrainings', N'CreatedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[ClientTrainings]
        ADD [CreatedAt] DATETIME2 NOT NULL
            CONSTRAINT [DF_ClientTrainings_CreatedAt] DEFAULT SYSDATETIME();
END;

IF OBJECT_ID(N'[dbo].[ClientTrainings]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ClientTrainings', N'UpdatedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[ClientTrainings]
        ADD [UpdatedAt] DATETIME2 NULL;
END;

IF OBJECT_ID(N'[dbo].[Trainings]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Trainings', N'CreatedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[Trainings]
        ADD [CreatedAt] DATETIME2 NOT NULL
            CONSTRAINT [DF_Trainings_CreatedAt] DEFAULT SYSDATETIME();
END;

IF OBJECT_ID(N'[dbo].[Trainings]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Trainings', N'UpdatedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[Trainings]
        ADD [UpdatedAt] DATETIME2 NULL;
END;

IF OBJECT_ID(N'[dbo].[Groups]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Groups', N'CreatedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[Groups]
        ADD [CreatedAt] DATETIME2 NOT NULL
            CONSTRAINT [DF_Groups_CreatedAt] DEFAULT SYSDATETIME();
END;

IF OBJECT_ID(N'[dbo].[Groups]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Groups', N'UpdatedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[Groups]
        ADD [UpdatedAt] DATETIME2 NULL;
END;

COMMIT TRANSACTION;
