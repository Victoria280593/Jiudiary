SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'[dbo].[ClientTrainings]', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ClientTrainings', N'Attended') IS NULL
BEGIN
    ALTER TABLE [dbo].[ClientTrainings]
        ADD [Attended] BIT NOT NULL
            CONSTRAINT [DF_ClientTrainings_Attended] DEFAULT (0);

    -- Существующие отметки создавались только через "Отметить тренировку",
    -- поэтому сам факт наличия записи уже означает посещение.
    UPDATE [dbo].[ClientTrainings]
        SET [Attended] = 1;

    ALTER TABLE [dbo].[ClientTrainings]
        DROP CONSTRAINT [DF_ClientTrainings_Attended];
END;

COMMIT TRANSACTION;
