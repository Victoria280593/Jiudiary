SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'[dbo].[StudentGroups]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[StudentGroups]
    (
        [Id] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT [PK_StudentGroups] PRIMARY KEY
            CONSTRAINT [DF_StudentGroups_Id] DEFAULT NEWSEQUENTIALID(),

        [GroupId] UNIQUEIDENTIFIER NOT NULL,
        [StudentId] UNIQUEIDENTIFIER NOT NULL,

        CONSTRAINT [FK_StudentGroups_Groups_GroupId]
            FOREIGN KEY ([GroupId])
            REFERENCES [dbo].[Groups] ([Id]),

        CONSTRAINT [FK_StudentGroups_ClientInfo_StudentId]
            FOREIGN KEY ([StudentId])
            REFERENCES [dbo].[ClientInfo] ([Id]),

        CONSTRAINT [UQ_StudentGroups_StudentId_GroupId]
            UNIQUE ([StudentId], [GroupId])
    );

    CREATE INDEX [IX_StudentGroups_GroupId]
        ON [dbo].[StudentGroups] ([GroupId]);
END;

COMMIT TRANSACTION;
