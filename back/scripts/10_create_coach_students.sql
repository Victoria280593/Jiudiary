SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'[dbo].[coach_students]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[coach_students]
    (
        [Id] UNIQUEIDENTIFIER NOT NULL,
        [CoachId] UNIQUEIDENTIFIER NOT NULL,
        [StudentId] UNIQUEIDENTIFIER NOT NULL,
        [CreateDate] DATETIME2 NOT NULL,
        CONSTRAINT [PK_coach_students] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_coach_students_Coaches] FOREIGN KEY ([CoachId])
            REFERENCES [dbo].[Users] ([Id]),
        CONSTRAINT [FK_coach_students_Students] FOREIGN KEY ([StudentId])
            REFERENCES [dbo].[Users] ([Id])
    );

    INSERT INTO [dbo].[coach_students] ([Id], [CoachId], [StudentId], [CreateDate])
    SELECT NEWID(), [CoachId], [StudentId], MIN([CreateDate])
    FROM [dbo].[StudentsRequests]
    WHERE [Status] = 2 AND [IsDeleted] = 0
    GROUP BY [CoachId], [StudentId];
END;

COMMIT TRANSACTION;
