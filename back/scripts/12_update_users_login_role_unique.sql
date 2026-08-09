SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @dropConstraintSql NVARCHAR(MAX) = N'';

SELECT @dropConstraintSql = STRING_AGG(
    N'ALTER TABLE [dbo].[Users] DROP CONSTRAINT [' + kc.[name] + N']',
    N';' + CHAR(13) + CHAR(10))
FROM sys.key_constraints AS kc
WHERE kc.[parent_object_id] = OBJECT_ID(N'[dbo].[Users]')
  AND kc.[type] = N'UQ'
  AND EXISTS
  (
      SELECT 1
      FROM sys.index_columns AS ic
      INNER JOIN sys.columns AS c
          ON c.[object_id] = ic.[object_id]
         AND c.[column_id] = ic.[column_id]
      WHERE ic.[object_id] = kc.[parent_object_id]
        AND ic.[index_id] = kc.[unique_index_id]
      GROUP BY ic.[object_id], ic.[index_id]
      HAVING COUNT(*) = 1
         AND MAX(CASE WHEN c.[name] = N'Login' THEN 1 ELSE 0 END) = 1
  );

IF @dropConstraintSql <> N''
BEGIN
    EXEC sp_executesql @dropConstraintSql;
END;

IF NOT EXISTS
(
    SELECT 1
    FROM sys.key_constraints AS kc
    WHERE kc.[parent_object_id] = OBJECT_ID(N'[dbo].[Users]')
      AND kc.[name] = N'UQ_Users_Login_RoleId'
)
BEGIN
    ALTER TABLE [dbo].[Users]
        ADD CONSTRAINT [UQ_Users_Login_RoleId]
        UNIQUE ([Login], [RoleId]);
END;

COMMIT TRANSACTION;
