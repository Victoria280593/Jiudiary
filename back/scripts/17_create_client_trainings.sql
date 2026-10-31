SET XACT_ABORT ON;
BEGIN TRANSACTION;

CREATE TABLE [dbo].[ClientTrainings]
(
    [Id] UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT [PK_ClientTrainings] PRIMARY KEY
        CONSTRAINT [DF_ClientTrainings_Id] DEFAULT NEWSEQUENTIALID(),

    [ClientInfoId] UNIQUEIDENTIFIER NOT NULL,
    [TrainingId] UNIQUEIDENTIFIER NOT NULL,
    [Rounds] INT NULL,
    [CreatedAt] DATETIME2 NOT NULL
        CONSTRAINT [DF_ClientTrainings_CreatedAt] DEFAULT SYSUTCDATETIME(),

    CONSTRAINT [FK_ClientTrainings_ClientInfo_ClientInfoId]
        FOREIGN KEY ([ClientInfoId])
        REFERENCES [dbo].[ClientInfo] ([Id]),

    CONSTRAINT [FK_ClientTrainings_Trainings_TrainingId]
        FOREIGN KEY ([TrainingId])
        REFERENCES [dbo].[Trainings] ([Id])
        ON DELETE CASCADE,

    CONSTRAINT [UQ_ClientTrainings_ClientInfoId_TrainingId]
        UNIQUE ([ClientInfoId], [TrainingId]),

    CONSTRAINT [CK_ClientTrainings_Rounds]
        CHECK ([Rounds] IS NULL OR [Rounds] >= 0)
);

COMMIT TRANSACTION;
