IF OBJECT_ID(N'dbo.ClientInfo', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ClientInfo
    (
        UserId uniqueidentifier NOT NULL,
          Country nvarchar(100) NULL,
          City nvarchar(100) NULL,
          BirthDate date NULL,
          Belt nvarchar(100) NULL,
          StripesCount int NOT NULL
            CONSTRAINT DF_ClientInfo_StripesCount DEFAULT (0),
        CONSTRAINT PK_ClientInfo PRIMARY KEY (UserId),
        CONSTRAINT FK_ClientInfo_Users_UserId
            FOREIGN KEY (UserId) REFERENCES dbo.Users (Id)
            ON DELETE CASCADE,
        CONSTRAINT CK_ClientInfo_StripesCount_NonNegative
            CHECK (StripesCount >= 0)
    );
END;

IF COL_LENGTH(N'dbo.ClientInfo', N'BirthDate') IS NULL
BEGIN
    ALTER TABLE dbo.ClientInfo ADD BirthDate date NULL;
END;

IF COL_LENGTH(N'dbo.ClientInfo', N'Belt') IS NULL
BEGIN
    ALTER TABLE dbo.ClientInfo ADD Belt nvarchar(100) NULL;
END;
