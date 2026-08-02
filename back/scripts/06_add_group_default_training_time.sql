IF COL_LENGTH(N'dbo.Groups', N'DefaultStartTime') IS NULL
BEGIN
    ALTER TABLE [dbo].[Groups]
        ADD [DefaultStartTime] TIME(0) NULL;
END;
GO

IF COL_LENGTH(N'dbo.Groups', N'DefaultEndTime') IS NULL
BEGIN
    ALTER TABLE [dbo].[Groups]
        ADD [DefaultEndTime] TIME(0) NULL;
END;
GO