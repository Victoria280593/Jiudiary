SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'[dbo].[ClientDayNotes]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[ClientDayNotes]
    (
        [Id] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT [PK_ClientDayNotes] PRIMARY KEY
            CONSTRAINT [DF_ClientDayNotes_Id] DEFAULT NEWSEQUENTIALID(),
        [ClientInfoId] UNIQUEIDENTIFIER NOT NULL,
        [Date] DATE NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL
            CONSTRAINT [DF_ClientDayNotes_CreatedAt] DEFAULT SYSDATETIME(),
        [UpdatedAt] DATETIME2 NULL,
        [Text] NVARCHAR(500) NOT NULL,

        CONSTRAINT [FK_ClientDayNotes_ClientInfo_ClientInfoId]
            FOREIGN KEY ([ClientInfoId])
            REFERENCES [dbo].[ClientInfo] ([Id])
    );
END;

IF EXISTS
(
    SELECT 1
    FROM [sys].[key_constraints]
    WHERE [name] = N'UQ_ClientDayNotes_ClientInfoId_Date'
      AND [parent_object_id] = OBJECT_ID(N'[dbo].[ClientDayNotes]')
)
BEGIN
    ALTER TABLE [dbo].[ClientDayNotes]
        DROP CONSTRAINT [UQ_ClientDayNotes_ClientInfoId_Date];
END;

IF NOT EXISTS
(
    SELECT 1
    FROM [sys].[indexes]
    WHERE [name] = N'IX_ClientDayNotes_ClientInfoId_Date'
      AND [object_id] = OBJECT_ID(N'[dbo].[ClientDayNotes]')
)
BEGIN
    CREATE INDEX [IX_ClientDayNotes_ClientInfoId_Date]
        ON [dbo].[ClientDayNotes] ([ClientInfoId], [Date]);
END;

COMMIT TRANSACTION;
