SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'[dbo].[ClientBelts]', N'U') IS NOT NULL
BEGIN
    DROP TABLE [dbo].[ClientBelts];
END;

CREATE TABLE [dbo].[ClientBelts]
(
    [Id] UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT [PK_ClientBelts] PRIMARY KEY
        CONSTRAINT [DF_ClientBelts_Id] DEFAULT NEWSEQUENTIALID(),

    [ClientInfoId] UNIQUEIDENTIFIER NOT NULL,
    [BeltId] INT NOT NULL,
    [ReceivedDate] DATE NULL,
    [StripesCount] INT NOT NULL,

    CONSTRAINT [FK_ClientBelts_ClientInfo_ClientInfoId]
        FOREIGN KEY ([ClientInfoId])
        REFERENCES [dbo].[ClientInfo] ([Id]),

    CONSTRAINT [FK_ClientBelts_Belts_BeltId]
        FOREIGN KEY ([BeltId])
        REFERENCES [dbo].[Belts] ([Id]),

    CONSTRAINT [CK_ClientBelts_StripesCount]
        CHECK ([StripesCount] >= 0)
);

COMMIT TRANSACTION;
