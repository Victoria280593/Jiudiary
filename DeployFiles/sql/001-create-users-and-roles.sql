IF DB_ID(N'$(DatabaseName)') IS NULL EXEC(N'CREATE DATABASE [' + '$(DatabaseName)' + N']');
GO

USE [$(DatabaseName)];
GO

IF OBJECT_ID(N'dbo.Roles', N'U') IS NULL
    CREATE TABLE dbo.Roles (Id INT NOT NULL CONSTRAINT PK_Roles PRIMARY KEY, Name NVARCHAR(50) NOT NULL CONSTRAINT UQ_Roles_Name UNIQUE);
GO



