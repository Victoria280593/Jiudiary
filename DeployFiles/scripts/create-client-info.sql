IF OBJECT_ID(N'dbo.ClientInfo', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.ClientInfo;
END;

IF OBJECT_ID(N'dbo.client_info', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.client_info;
END;

CREATE TABLE dbo.ClientInfo
(
    Id uniqueidentifier NOT NULL
        CONSTRAINT DF_ClientInfo_Id DEFAULT (NEWSEQUENTIALID()),
    UserId uniqueidentifier NOT NULL,
    Country nvarchar(100) NULL,
    City nvarchar(100) NULL,
    BirthDate date NULL,
    BeltId int NULL,
    StripesCount int NOT NULL
        CONSTRAINT DF_ClientInfo_StripesCount DEFAULT (0),
    CONSTRAINT PK_ClientInfo PRIMARY KEY (Id),
    CONSTRAINT UQ_ClientInfo_UserId UNIQUE (UserId),
    CONSTRAINT FK_ClientInfo_Users_UserId
        FOREIGN KEY (UserId) REFERENCES dbo.Users (Id)
        ON DELETE CASCADE,
    CONSTRAINT FK_ClientInfo_Belts_BeltId
        FOREIGN KEY (BeltId) REFERENCES dbo.Belts (Id)
        ON DELETE NO ACTION,
    CONSTRAINT CK_ClientInfo_StripesCount
        CHECK (StripesCount BETWEEN 0 AND 4)
);
