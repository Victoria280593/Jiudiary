SET XACT_ABORT ON;

BEGIN TRANSACTION;

DECLARE @BeltOrder TABLE
(
    Name nvarchar(100) NOT NULL PRIMARY KEY,
    NewId int NOT NULL UNIQUE
);

INSERT INTO @BeltOrder (Name, NewId)
VALUES
    (N'Белый', 1),
    (N'Серо-белый', 2),
    (N'Серый', 3),
    (N'Серо-чёрный', 4),
    (N'Жёлто-белый', 5),
    (N'Жёлтый', 6),
    (N'Жёлто-чёрный', 7),
    (N'Оранжево-белый', 8),
    (N'Оранжевый', 9),
    (N'Оранжево-чёрный', 10),
    (N'Зелёно-белый', 11),
    (N'Зелёный', 12),
    (N'Зелёно-чёрный', 13),
    (N'Синий', 14),
    (N'Фиолетовый', 15),
    (N'Коричневый', 16),
    (N'Чёрный', 17),
    (N'Чёрно-красный', 18),
    (N'Красный', 19);

IF EXISTS
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

-- Переносим ссылки ClientInfo на временный диапазон ID.
UPDATE clientInfo
SET clientInfo.BeltId = 10000 + beltOrder.NewId
FROM dbo.ClientInfo AS clientInfo
INNER JOIN dbo.Belts AS belt
    ON belt.Id = clientInfo.BeltId
INNER JOIN @BeltOrder AS beltOrder
    ON beltOrder.Name = belt.Name;

-- Переносим сами пояса во временный диапазон, чтобы избежать конфликтов PK.
UPDATE belt
SET belt.Id = 10000 + beltOrder.NewId
FROM dbo.Belts AS belt
INNER JOIN @BeltOrder AS beltOrder
    ON beltOrder.Name = belt.Name;

-- Устанавливаем итоговые ID.
UPDATE dbo.ClientInfo
SET BeltId = BeltId - 10000
WHERE BeltId BETWEEN 10001 AND 10019;

UPDATE dbo.Belts
SET Id = Id - 10000
WHERE Id BETWEEN 10001 AND 10019;

ALTER TABLE dbo.ClientInfo
    ADD CONSTRAINT FK_ClientInfo_Belts_BeltId
        FOREIGN KEY (BeltId) REFERENCES dbo.Belts (Id)
        ON DELETE NO ACTION;

COMMIT TRANSACTION;
