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

ALTER TABLE [dbo].[Groups]
ADD [ColorId] INT NOT NULL
    CONSTRAINT [DF_Groups_ColorId] DEFAULT (1);
GO

ALTER TABLE [dbo].[Groups]
ADD CONSTRAINT [FK_Groups_Colors_ColorId]
    FOREIGN KEY ([ColorId])
    REFERENCES [dbo].[Colors] ([Id]);
GO

CREATE INDEX [IX_Groups_ColorId]
    ON [dbo].[Groups] ([ColorId]);
GO
