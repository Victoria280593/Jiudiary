SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.ClientInfo', N'FirstName') IS NULL
BEGIN
    ALTER TABLE [dbo].[ClientInfo] ADD [FirstName] NVARCHAR(200) NULL;
END;

IF COL_LENGTH(N'dbo.ClientInfo', N'LastName') IS NULL
BEGIN
    ALTER TABLE [dbo].[ClientInfo] ADD [LastName] NVARCHAR(200) NULL;
END;

IF COL_LENGTH(N'dbo.ClientInfo', N'MiddleName') IS NULL
BEGIN
    ALTER TABLE [dbo].[ClientInfo] ADD [MiddleName] NVARCHAR(200) NULL;
END;

INSERT INTO [dbo].[ClientInfo] ([UserId])
SELECT users.[Id]
FROM [dbo].[Users] AS users
WHERE NOT EXISTS
(
    SELECT 1
    FROM [dbo].[ClientInfo] AS clientInfo
    WHERE clientInfo.[UserId] = users.[Id]
);

IF COL_LENGTH(N'dbo.Users', N'FirstName') IS NOT NULL
   OR COL_LENGTH(N'dbo.Users', N'Name') IS NOT NULL
BEGIN
    DECLARE @firstNameSource NVARCHAR(100) = CASE
        WHEN COL_LENGTH(N'dbo.Users', N'FirstName') IS NOT NULL THEN N'users.[FirstName]'
        ELSE N'users.[Name]'
    END;
    DECLARE @copyNamesSql NVARCHAR(MAX) = N'
        UPDATE clientInfo
        SET clientInfo.[FirstName] = COALESCE(NULLIF(clientInfo.[FirstName], N''''), ' + @firstNameSource + N', N''''),
            clientInfo.[LastName] = COALESCE(NULLIF(clientInfo.[LastName], N''''), ' +
            CASE WHEN COL_LENGTH(N'dbo.Users', N'LastName') IS NOT NULL THEN N'users.[LastName]' ELSE N'N''''' END + N', N''''),
            clientInfo.[MiddleName] = COALESCE(clientInfo.[MiddleName], ' +
            CASE WHEN COL_LENGTH(N'dbo.Users', N'MiddleName') IS NOT NULL THEN N'users.[MiddleName]' ELSE N'NULL' END + N')
        FROM [dbo].[ClientInfo] AS clientInfo
        INNER JOIN [dbo].[Users] AS users ON users.[Id] = clientInfo.[UserId];';

    EXEC sp_executesql @copyNamesSql;
END;

EXEC sp_executesql N'
    UPDATE [dbo].[ClientInfo] SET [FirstName] = N'''' WHERE [FirstName] IS NULL;
    UPDATE [dbo].[ClientInfo] SET [LastName] = N'''' WHERE [LastName] IS NULL;

    ALTER TABLE [dbo].[ClientInfo] ALTER COLUMN [FirstName] NVARCHAR(200) NOT NULL;
    ALTER TABLE [dbo].[ClientInfo] ALTER COLUMN [LastName] NVARCHAR(200) NOT NULL;';

DECLARE @dropDefaultsSql NVARCHAR(MAX) = N'';

SELECT @dropDefaultsSql = STRING_AGG(
    N'ALTER TABLE [dbo].[Users] DROP CONSTRAINT [' + defaults.[name] + N']',
    N';' + CHAR(13) + CHAR(10))
FROM sys.default_constraints AS defaults
INNER JOIN sys.columns AS columns
    ON columns.[object_id] = defaults.[parent_object_id]
   AND columns.[column_id] = defaults.[parent_column_id]
WHERE defaults.[parent_object_id] = OBJECT_ID(N'dbo.Users')
  AND columns.[name] IN (N'Name', N'FirstName', N'LastName', N'MiddleName');

IF @dropDefaultsSql <> N''
BEGIN
    EXEC sp_executesql @dropDefaultsSql;
END;

IF COL_LENGTH(N'dbo.Users', N'MiddleName') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Users] DROP COLUMN [MiddleName];
END;

IF COL_LENGTH(N'dbo.Users', N'LastName') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Users] DROP COLUMN [LastName];
END;

IF COL_LENGTH(N'dbo.Users', N'FirstName') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Users] DROP COLUMN [FirstName];
END;

IF COL_LENGTH(N'dbo.Users', N'Name') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Users] DROP COLUMN [Name];
END;

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
