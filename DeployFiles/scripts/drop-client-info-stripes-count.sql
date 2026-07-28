IF COL_LENGTH(N'dbo.ClientInfo', N'StripesCount') IS NULL
BEGIN
    PRINT N'Столбец dbo.ClientInfo.StripesCount уже отсутствует.';
    RETURN;
END;

IF OBJECT_ID(N'dbo.CK_ClientInfo_StripesCount', N'C') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ClientInfo
        DROP CONSTRAINT CK_ClientInfo_StripesCount;
END;

IF OBJECT_ID(N'dbo.DF_ClientInfo_StripesCount', N'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ClientInfo
        DROP CONSTRAINT DF_ClientInfo_StripesCount;
END;

ALTER TABLE dbo.ClientInfo
    DROP COLUMN StripesCount;

PRINT N'Столбец dbo.ClientInfo.StripesCount удалён.';
