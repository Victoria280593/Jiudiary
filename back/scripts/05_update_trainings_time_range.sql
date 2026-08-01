IF COL_LENGTH(N'dbo.Trainings', N'StartTime') IS NULL
BEGIN
    IF COL_LENGTH(N'dbo.Trainings', N'Date') IS NOT NULL
    BEGIN
        EXEC sp_rename N'dbo.Trainings.Date', N'StartTime', N'COLUMN';
    END
    ELSE IF COL_LENGTH(N'dbo.Trainings', N'Time') IS NOT NULL
    BEGIN
        EXEC sp_rename N'dbo.Trainings.Time', N'StartTime', N'COLUMN';
    END
END;
GO

IF COL_LENGTH(N'dbo.Trainings', N'EndTime') IS NULL
BEGIN
    ALTER TABLE [dbo].[Trainings]
        ADD [EndTime] DATETIME2 NULL;
END;
GO

IF COL_LENGTH(N'dbo.Trainings', N'EndTime') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        UPDATE [dbo].[Trainings]
        SET [EndTime] = DATEADD(MINUTE, 90, [StartTime])
        WHERE [EndTime] IS NULL;
    ';

    ALTER TABLE [dbo].[Trainings]
        ALTER COLUMN [EndTime] DATETIME2 NOT NULL;
END;
GO
