CREATE TABLE [dbo].[Groups]
(
    [Id] UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT [PK_Groups] PRIMARY KEY
        CONSTRAINT [DF_Groups_Id] DEFAULT NEWSEQUENTIALID(),

    [Name] NVARCHAR(200) NOT NULL,

    [CreatedAt] DATETIME2(0) NOT NULL
        CONSTRAINT [DF_Groups_CreatedAt] DEFAULT SYSDATETIME()
);
GO

CREATE TABLE [dbo].[CoachGroups]
(
    [Id] UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT [PK_CoachGroups] PRIMARY KEY
        CONSTRAINT [DF_CoachGroups_Id] DEFAULT NEWSEQUENTIALID(),

    [CoachId] UNIQUEIDENTIFIER NOT NULL,
    [GroupId] UNIQUEIDENTIFIER NOT NULL,

    CONSTRAINT [FK_CoachGroups_ClientInfo_CoachId]
        FOREIGN KEY ([CoachId])
        REFERENCES [dbo].[ClientInfo] ([Id]),

    CONSTRAINT [FK_CoachGroups_Groups_GroupId]
        FOREIGN KEY ([GroupId])
        REFERENCES [dbo].[Groups] ([Id]),

    CONSTRAINT [UQ_CoachGroups_CoachId_GroupId]
        UNIQUE ([CoachId], [GroupId])
);
GO

CREATE TABLE [dbo].[Trainings]
(
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [CoachId] UNIQUEIDENTIFIER NOT NULL,
    [GroupId] UNIQUEIDENTIFIER NOT NULL,
    [Description] NVARCHAR(300) NULL,
    [Time] DATETIME2 NOT NULL,

    CONSTRAINT [PK_Trainings]
        PRIMARY KEY ([Id]),

    CONSTRAINT [FK_Trainings_ClientInfo_CoachId]
        FOREIGN KEY ([CoachId])
        REFERENCES [dbo].[ClientInfo] ([Id]),

    CONSTRAINT [FK_Trainings_Groups_GroupId]
        FOREIGN KEY ([GroupId])
        REFERENCES [dbo].[Groups] ([Id])
);
GO
