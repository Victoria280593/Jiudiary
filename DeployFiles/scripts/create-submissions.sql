IF OBJECT_ID(N'dbo.Submissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Submissions
    (
        Id int NOT NULL,
        Name nvarchar(150) NOT NULL,
        CONSTRAINT PK_Submissions PRIMARY KEY (Id),
        CONSTRAINT UQ_Submissions_Name UNIQUE (Name)
    );
END;

MERGE dbo.Submissions AS target
USING
(
    VALUES
        (1,  N'Рычаг локтя'),
        (2,  N'Треугольный рычаг локтя'),
        (3,  N'Обратный треугольник'),
        (4,  N'Обратный рычаг локтя'),
        (5,  N'Американа'),
        (6,  N'Кимура'),
        (7,  N'Омо плата'),
        (8,  N'Барата плата'),
        (9,  N'Вирст лок'),
        (10, N'Рычаг локтя из маунта'),
        (11, N'Рычаг локтя в прыжке'),
        (12, N'Бицепс-слайсер'),
        (13, N'Моноплата'),
        (14, N'Распятье'),
        (15, N'Прямой ахилл'),
        (16, N'Скрутка пятки (хилхук)'),
        (17, N'Футлок'),
        (18, N'Рычаг колена'),
        (19, N'Калф-слайсер'),
        (20, N'Твистер'),
        (21, N'Банана-сплит'),
        (22, N'Эстима-лок'),
        (23, N'Треугольник'),
        (24, N'Гильотина'),
        (25, N'Кросс чок'),
        (26, N'Удушение сзади (Мата Леао)'),
        (27, N'Лук и стрелы'),
        (28, N'Удушение Иезекииля'),
        (29, N'Дарс-чок'),
        (30, N'Анаконда'),
        (31, N'Петельное удушение'),
        (32, N'Север-юг'),
        (33, N'Бейсбол чок'),
        (34, N'Джокер-чок')
) AS source (Id, Name)
ON target.Id = source.Id
WHEN MATCHED THEN
    UPDATE SET Name = source.Name
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Id, Name)
    VALUES (source.Id, source.Name);
