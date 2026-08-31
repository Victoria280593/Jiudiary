IF OBJECT_ID(N'dbo.Submissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Submissions
    (
        Id int NOT NULL,
        Name nvarchar(150) NOT NULL,
        NameEn nvarchar(150) NOT NULL,
        CONSTRAINT PK_Submissions PRIMARY KEY (Id),
        CONSTRAINT UQ_Submissions_Name UNIQUE (Name),
        CONSTRAINT UQ_Submissions_NameEn UNIQUE (NameEn)
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Submissions') AND name = N'NameEn'
)
BEGIN
    ALTER TABLE dbo.Submissions ADD NameEn nvarchar(150) NOT NULL CONSTRAINT DF_Submissions_NameEn DEFAULT (N'') WITH VALUES;
    ALTER TABLE dbo.Submissions DROP CONSTRAINT DF_Submissions_NameEn;
    ALTER TABLE dbo.Submissions ADD CONSTRAINT UQ_Submissions_NameEn UNIQUE (NameEn);
END;

MERGE dbo.Submissions AS target
USING
(
    VALUES
        (1,  N'Рычаг локтя',                     N'Armbar'),
        (2,  N'Рычаг локтя из треугольника',      N'Triangle armbar'),
        (3,  N'Обратный треугольник',             N'Reverse triangle'),
        (4,  N'Обратный рычаг локтя',             N'Reverse armbar'),
        (5,  N'Американа',                        N'Americana'),
        (6,  N'Кимура',                           N'Kimura'),
        (7,  N'Омо плата',                        N'Omoplata'),
        (8,  N'Барата плата',                     N'Baratoplata'),
        (9,  N'Вирст лок',                        N'Wristlock'),
        (10, N'Рычаг локтя из маунта',            N'Armbar from mount'),
        (11, N'Рычаг локтя в прыжке',             N'Flying armbar'),
        (12, N'Бицепс-слайсер',                   N'Biceps slicer'),
        (13, N'Моноплата',                        N'Monoplata'),
        (14, N'Распятье',                         N'Crucifix'),
        (15, N'Прямой ахилл',                     N'Straight ankle lock'),
        (16, N'Скрутка пятки (хилхук)',           N'Heel hook'),
        (17, N'Футлок',                           N'Footlock'),
        (18, N'Рычаг колена',                     N'Kneebar'),
        (19, N'Калф-слайсер',                     N'Calf slicer'),
        (20, N'Твистер',                          N'Twister'),
        (21, N'Банана-сплит',                     N'Banana split'),
        (22, N'Эстима-лок',                       N'Estima lock'),
        (23, N'Треугольник',                      N'Triangle choke'),
        (24, N'Гильотина',                        N'Guillotine choke'),
        (25, N'Кросс чок',                        N'Cross collar choke'),
        (26, N'Удушение сзади (Мата Леао)',       N'Rear naked choke'),
        (27, N'Лук и стрелы',                     N'Bow and arrow choke'),
        (28, N'Удушение Иезекииля',               N'Ezekiel choke'),
        (29, N'Дарс-чок',                         N'D''Arce choke'),
        (30, N'Анаконда',                         N'Anaconda choke'),
        (31, N'Луп чок',                          N'Loop choke'),
        (32, N'Север-юг',                         N'North-south choke'),
        (33, N'Бейсбол чок',                      N'Baseball choke'),
        (34, N'Джокер-чок',                       N'Joker choke')
) AS source (Id, Name, NameEn)
ON target.Id = source.Id
WHEN MATCHED THEN
    UPDATE SET Name = source.Name, NameEn = source.NameEn
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Id, Name, NameEn)
    VALUES (source.Id, source.Name, source.NameEn);
