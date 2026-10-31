IF OBJECT_ID(N'dbo.AdminAuditLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AdminAuditLogs
    (
        Id uniqueidentifier NOT NULL CONSTRAINT PK_AdminAuditLogs PRIMARY KEY,
        ActorLogin nvarchar(256) NOT NULL,
        EventType nvarchar(50) NOT NULL,
        Action nvarchar(10) NOT NULL,
        Path nvarchar(512) NOT NULL,
        StatusCode int NOT NULL,
        Details nvarchar(2000) NULL,
        IpAddress nvarchar(64) NULL,
        CreatedAt datetime2 NOT NULL
    );

    CREATE INDEX IX_AdminAuditLogs_CreatedAt
        ON dbo.AdminAuditLogs (CreatedAt DESC);
END;
