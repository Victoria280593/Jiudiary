CREATE TABLE dbo.ClientTrainingSubmissions
(
    ClientTrainingId uniqueidentifier NOT NULL,
    SubmissionId int NOT NULL,
    Count int NOT NULL CONSTRAINT DF_ClientTrainingSubmissions_Count DEFAULT (1),
    CONSTRAINT PK_ClientTrainingSubmissions PRIMARY KEY (ClientTrainingId, SubmissionId),
    CONSTRAINT FK_ClientTrainingSubmissions_ClientTrainings FOREIGN KEY (ClientTrainingId)
        REFERENCES dbo.ClientTrainings (Id) ON DELETE CASCADE,
    CONSTRAINT FK_ClientTrainingSubmissions_Submissions FOREIGN KEY (SubmissionId)
        REFERENCES dbo.Submissions (Id),
    CONSTRAINT CK_ClientTrainingSubmissions_Count CHECK (Count > 0)
);

CREATE INDEX IX_ClientTrainingSubmissions_SubmissionId
    ON dbo.ClientTrainingSubmissions (SubmissionId);
