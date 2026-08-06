SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'[dbo].[StudentsRequests]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[StudentsRequests]
    (
        [Id] UNIQUEIDENTIFIER NOT NULL,
        [StudentId] UNIQUEIDENTIFIER NOT NULL,
        [CoachId] UNIQUEIDENTIFIER NOT NULL,
        [Status] INT NOT NULL,
        [CreateDate] DATETIME2 NOT NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT [DF_StudentsRequests_IsDeleted] DEFAULT (0),
        CONSTRAINT [PK_StudentsRequests] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_StudentsRequests_Status] CHECK ([Status] IN (1, 2, 3)),
        CONSTRAINT [FK_StudentsRequests_Students] FOREIGN KEY ([StudentId])
            REFERENCES [dbo].[Users] ([Id]),
        CONSTRAINT [FK_StudentsRequests_Coaches] FOREIGN KEY ([CoachId])
            REFERENCES [dbo].[Users] ([Id])
    );

END;

COMMIT TRANSACTION;
