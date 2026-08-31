IF OBJECT_ID(N'dbo.SubmissionAliases', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SubmissionAliases
    (
        Id uniqueidentifier NOT NULL CONSTRAINT DF_SubmissionAliases_Id DEFAULT NEWSEQUENTIALID(),
        SubmissionId int NOT NULL,
        Alias nvarchar(150) NOT NULL,
        CONSTRAINT PK_SubmissionAliases PRIMARY KEY (Id),
        CONSTRAINT UQ_SubmissionAliases_Alias UNIQUE (Alias),
        CONSTRAINT FK_SubmissionAliases_Submissions_SubmissionId
            FOREIGN KEY (SubmissionId) REFERENCES dbo.Submissions (Id)
    );
END;

MERGE dbo.SubmissionAliases AS target
USING
(
    VALUES
        (1,  N'армбар'),
        (1,  N'arm bar'),
        (1,  N'juji gatame'),
        (1,  N'джуджи гатаме'),
        (2,  N'армбар из треугольника'),
        (2,  N'triangle arm bar'),
        (2,  N'треугольный армбар'),
        (3,  N'реверс триангл'),
        (3,  N'revers triangle'),
        (4,  N'реверс армбар'),
        (5,  N'american'),
        (5,  N'key lock'),
        (5,  N'кийлок'),
        (6,  N'reverse keylock'),
        (6,  N'chicken wing'),
        (7,  N'омоплата'),
        (8,  N'баратоплата'),
        (9,  N'врист-лок'),
        (9,  N'wrist lock'),
        (10, N'армбар из маунта'),
        (11, N'флаинг армбар'),
        (12, N'biceps crusher'),
        (12, N'бицепс кранчер'),
        (13, N'моноплата'),
        (14, N'крусификс'),
        (15, N'ахиллова петля'),
        (15, N'achilles lock'),
        (16, N'хилхук'),
        (16, N'heel hook'),
        (17, N'foot lock'),
        (18, N'ни бар'),
        (18, N'knee bar'),
        (19, N'калф слайсер'),
        (20, N'твистер'),
        (21, N'банана сплит'),
        (22, N'эстима лок'),
        (23, N'триангл'),
        (23, N'triangle'),
        (24, N'гильотина'),
        (24, N'guillotine'),
        (25, N'кросс чок'),
        (26, N'rnc'),
        (26, N'мата леао'),
        (26, N'mata leao'),
        (27, N'лук и стрелы'),
        (28, N'эзекиль чок'),
        (29, N'darce'),
        (29, N'дарс'),
        (30, N'анаконда чок'),
        (31, N'петельное удушение'),
        (32, N'норд-саут'),
        (33, N'бейсболл чок'),
        (34, N'джокер чок')
) AS source (SubmissionId, Alias)
ON target.Alias = source.Alias
WHEN MATCHED THEN
    UPDATE SET SubmissionId = source.SubmissionId
WHEN NOT MATCHED BY TARGET THEN
    INSERT (SubmissionId, Alias)
    VALUES (source.SubmissionId, source.Alias);
