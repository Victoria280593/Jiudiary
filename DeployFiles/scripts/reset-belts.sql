SET XACT_ABORT ON;

BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.ClientInfo', N'U') IS NOT NULL
   AND EXISTS
   (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_ClientInfo_Belts_BeltId'
         AND parent_object_id = OBJECT_ID(N'dbo.ClientInfo')
   )
BEGIN
    ALTER TABLE dbo.ClientInfo
        DROP CONSTRAINT FK_ClientInfo_Belts_BeltId;

END;

IF OBJECT_ID(N'dbo.ClientInfo', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ClientInfo', N'BeltId') IS NOT NULL
BEGIN
    -- Старые ID больше не соответствуют новой таблице поясов.
    UPDATE dbo.ClientInfo
    SET BeltId = NULL;
END;

IF OBJECT_ID(N'dbo.Belts', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Belts;
END;

CREATE TABLE dbo.Belts
(
    Id int NOT NULL,
    Name nvarchar(100) NOT NULL,
    CONSTRAINT PK_Belts PRIMARY KEY (Id),
    CONSTRAINT UQ_Belts_Name UNIQUE (Name)
);

INSERT INTO dbo.Belts (Id, Name)
VALUES
    (1,  N'Белый'),
    (2,  N'Серо-белый'),
    (3,  N'Серый'),
    (4,  N'Серо-чёрный'),
    (5,  N'Жёлто-белый'),
    (6,  N'Жёлтый'),
    (7,  N'Жёлто-чёрный'),
    (8,  N'Оранжево-белый'),
    (9,  N'Оранжевый'),
    (10, N'Оранжево-чёрный'),
    (11, N'Зелёно-белый'),
    (12, N'Зелёный'),
    (13, N'Зелёно-чёрный'),
    (14, N'Синий'),
    (15, N'Фиолетовый'),
    (16, N'Коричневый'),
    (17, N'Чёрный'),
    (18, N'Чёрно-красный'),
    (19, N'Красный');

IF OBJECT_ID(N'dbo.ClientInfo', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ClientInfo
        ADD CONSTRAINT FK_ClientInfo_Belts_BeltId
            FOREIGN KEY (BeltId) REFERENCES dbo.Belts (Id)
            ON DELETE NO ACTION;
END;

COMMIT TRANSACTION;
