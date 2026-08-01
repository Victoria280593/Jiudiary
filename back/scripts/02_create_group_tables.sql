CREATE TABLE [dbo].[Colors]
(
    [Id] INT NOT NULL
        CONSTRAINT [PK_Colors] PRIMARY KEY,

    [Name] NVARCHAR(50) NOT NULL
        CONSTRAINT [UQ_Colors_Name] UNIQUE
);
GO

INSERT INTO [dbo].[Colors] ([Id], [Name])
VALUES
    (1, N'Red'),
    (2, N'Blue'),
    (3, N'Green'),
    (4, N'Yellow'),
    (5, N'Purple');
GO

CREATE TABLE [dbo].[Groups]
(
    [Id] UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT [PK_Groups] PRIMARY KEY
        CONSTRAINT [DF_Groups_Id] DEFAULT NEWSEQUENTIALID(),

    [Name] NVARCHAR(200) NOT NULL,

    [ColorId] INT NOT NULL
        CONSTRAINT [DF_Groups_ColorId] DEFAULT (1),

    [CreatedAt] DATETIME2(0) NOT NULL
        CONSTRAINT [DF_Groups_CreatedAt] DEFAULT SYSDATETIME(),

    CONSTRAINT [FK_Groups_Colors_ColorId]
        FOREIGN KEY ([ColorId])
        REFERENCES [dbo].[Colors] ([Id])
);
GO

CREATE INDEX [IX_Groups_ColorId]
    ON [dbo].[Groups] ([ColorId]);
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
