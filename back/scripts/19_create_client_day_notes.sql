SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'[dbo].[Notes]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Notes]
    (
        [Id] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT [PK_Notes] PRIMARY KEY
            CONSTRAINT [DF_Notes_Id] DEFAULT NEWSEQUENTIALID(),
        [ClientInfoId] UNIQUEIDENTIFIER NOT NULL,
        [Date] DATE NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL
            CONSTRAINT [DF_Notes_CreatedAt] DEFAULT SYSDATETIME(),
        [UpdatedAt] DATETIME2 NULL,
        [Text] NVARCHAR(500) NOT NULL,

        CONSTRAINT [FK_Notes_ClientInfo_ClientInfoId]
            FOREIGN KEY ([ClientInfoId])
            REFERENCES [dbo].[ClientInfo] ([Id])
    );
END;

IF EXISTS
(
    SELECT 1
    FROM [sys].[key_constraints]
    WHERE [name] = N'UQ_Notes_ClientInfoId_Date'
      AND [parent_object_id] = OBJECT_ID(N'[dbo].[Notes]')
)
BEGIN
    ALTER TABLE [dbo].[Notes]
        DROP CONSTRAINT [UQ_Notes_ClientInfoId_Date];
END;

IF NOT EXISTS
(
    SELECT 1
    FROM [sys].[indexes]
    WHERE [name] = N'IX_Notes_ClientInfoId_Date'
      AND [object_id] = OBJECT_ID(N'[dbo].[Notes]')
)
BEGIN
    CREATE INDEX [IX_Notes_ClientInfoId_Date]
        ON [dbo].[Notes] ([ClientInfoId], [Date]);
END;

COMMIT TRANSACTION;
