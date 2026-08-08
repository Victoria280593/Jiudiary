SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'[dbo].[CoachStudents]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[CoachStudents]
    (
        [Id] UNIQUEIDENTIFIER NOT NULL,
        [CoachId] UNIQUEIDENTIFIER NOT NULL,
        [StudentId] UNIQUEIDENTIFIER NOT NULL,
        [CreateDate] DATETIME2 NOT NULL,
        CONSTRAINT [PK_CoachStudents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CoachStudents_Coaches] FOREIGN KEY ([CoachId])
            REFERENCES [dbo].[Users] ([Id]),
        CONSTRAINT [FK_CoachStudents_Students] FOREIGN KEY ([StudentId])
            REFERENCES [dbo].[Users] ([Id])
    );
END;

IF OBJECT_ID(N'[dbo].[coach_students]', N'U') IS NOT NULL
BEGIN
    INSERT INTO [dbo].[CoachStudents] ([Id], [CoachId], [StudentId], [CreateDate])
    SELECT [old].[Id], [old].[CoachId], [old].[StudentId], [old].[CreateDate]
    FROM [dbo].[coach_students] AS [old]
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM [dbo].[CoachStudents] AS [new]
        WHERE [new].[Id] = [old].[Id]
    );

    DROP TABLE [dbo].[coach_students];
END;

COMMIT TRANSACTION;
