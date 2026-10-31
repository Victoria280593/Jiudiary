SET XACT_ABORT ON;

BEGIN TRANSACTION;

IF EXISTS (
    SELECT 1
    FROM dbo.Submissions
    WHERE Id = 32
      AND (NameRu <> N'Ручной треугольник' OR NameEn <> N'Arm triangle choke')
)
BEGIN
    THROW 50001, N'Идентификатор 32 уже занят другим приёмом.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM dbo.Submissions
    WHERE Id <> 32
      AND (NameRu = N'Ручной треугольник' OR NameEn = N'Arm triangle choke')
)
BEGIN
    THROW 50002, N'Ручной треугольник уже существует с другим идентификатором.', 1;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Submissions WHERE Id = 32)
BEGIN
    INSERT INTO dbo.Submissions (Id, NameRu, NameEn)
    VALUES (32, N'Ручной треугольник', N'Arm triangle choke');
END;

IF EXISTS (
    SELECT 1
    FROM dbo.Submissions
    WHERE Id = 33
      AND (NameRu <> N'Чой-бар' OR NameEn <> N'Choi bar')
)
BEGIN
    THROW 50003, N'Идентификатор 33 уже занят другим приёмом.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM dbo.Submissions
    WHERE Id <> 33
      AND (NameRu = N'Чой-бар' OR NameEn = N'Choi bar')
)
BEGIN
    THROW 50004, N'Чой-бар уже существует с другим идентификатором.', 1;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Submissions WHERE Id = 33)
BEGIN
    INSERT INTO dbo.Submissions (Id, NameRu, NameEn)
    VALUES (33, N'Чой-бар', N'Choi bar');
END;

COMMIT TRANSACTION;
