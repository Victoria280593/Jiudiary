IF NOT EXISTS (SELECT 1 FROM [dbo].[Colors] WHERE [Id] = 6)
BEGIN
    INSERT INTO [dbo].[Colors] ([Id], [Name])
    VALUES (6, N'Brown');
END;
GO

IF OBJECT_ID(N'[dbo].[DF_Groups_ColorId]', N'D') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Groups]
    DROP CONSTRAINT [DF_Groups_ColorId];
END;
GO

ALTER TABLE [dbo].[Groups]
ADD CONSTRAINT [DF_Groups_ColorId]
    DEFAULT (6) FOR [ColorId];
GO
