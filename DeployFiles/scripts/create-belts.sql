IF OBJECT_ID(N'dbo.Belts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Belts
    (
        Id int NOT NULL,
        Name nvarchar(100) NOT NULL,
        CONSTRAINT PK_Belts PRIMARY KEY (Id),
        CONSTRAINT UQ_Belts_Name UNIQUE (Name)
    );
END;

MERGE dbo.Belts AS target
USING
(
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
        (19, N'Красный')
) AS source (Id, Name)
ON target.Id = source.Id
WHEN MATCHED THEN
    UPDATE SET Name = source.Name
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Id, Name)
    VALUES (source.Id, source.Name);
