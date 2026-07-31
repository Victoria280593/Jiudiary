-- Удаляются только разрешённые таблицы и только в порядке зависимостей.
IF OBJECT_ID(N'[dbo].[Trainings]', N'U') IS NOT NULL
BEGIN
    DROP TABLE [dbo].[Trainings];
END;
GO

IF OBJECT_ID(N'[dbo].[CoachBranches]', N'U') IS NOT NULL
BEGIN
    DROP TABLE [dbo].[CoachBranches];
END;
GO

IF OBJECT_ID(N'[dbo].[Branches]', N'U') IS NOT NULL
BEGIN
    DROP TABLE [dbo].[Branches];
END;
GO
