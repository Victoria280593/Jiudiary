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

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Submissions') AND name = N'NameEn'
)
BEGIN
    IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'UQ_Submissions_NameEn')
        ALTER TABLE dbo.Submissions DROP CONSTRAINT UQ_Submissions_NameEn;

    ALTER TABLE dbo.Submissions DROP COLUMN NameEn;
END;

MERGE dbo.Submissions AS target
USING
(
    VALUES
        (1,  N'Armbar'),
        (2,  N'Triangle armbar'),
        (3,  N'Reverse triangle'),
        (4,  N'Reverse armbar'),
        (5,  N'Americana'),
        (6,  N'Kimura'),
        (7,  N'Omoplata'),
        (8,  N'Baratoplata'),
        (9,  N'Wristlock'),
        (10, N'Armbar from mount'),
        (11, N'Flying armbar'),
        (12, N'Biceps slicer'),
        (13, N'Monoplata'),
        (14, N'Crucifix'),
        (15, N'Straight ankle lock'),
        (16, N'Heel hook'),
        (17, N'Footlock'),
        (18, N'Kneebar'),
        (19, N'Calf slicer'),
        (20, N'Twister'),
        (21, N'Banana split'),
        (22, N'Estima lock'),
        (23, N'Triangle choke'),
        (24, N'Guillotine choke'),
        (25, N'Cross collar choke'),
        (26, N'Rear naked choke'),
        (27, N'Bow and arrow choke'),
        (28, N'Ezekiel choke'),
        (29, N'D''Arce choke'),
        (30, N'Anaconda choke'),
        (31, N'Loop choke'),
        (32, N'North-south choke'),
        (33, N'Baseball choke'),
        (34, N'Joker choke')
) AS source (Id, Name)
ON target.Id = source.Id
WHEN MATCHED THEN
    UPDATE SET Name = source.Name
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Id, Name)
    VALUES (source.Id, source.Name);
