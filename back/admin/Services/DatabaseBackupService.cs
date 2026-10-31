using JiuDiary.Admin.Models;
using Microsoft.Data.SqlClient;

namespace JiuDiary.Admin.Services;

public sealed class DatabaseBackupService(IConfiguration configuration)
{
    private const string BackupQuery = """
        SELECT TOP (@Limit)
            backup_start_date,
            type,
            COALESCE(compressed_backup_size, backup_size) AS size_bytes,
            COALESCE(MAX(physical_device_name), '') AS physical_device_name
        FROM msdb.dbo.backupset AS backup_set
        LEFT JOIN msdb.dbo.backupmediafamily AS media_family
            ON backup_set.media_set_id = media_family.media_set_id
        WHERE database_name = @DatabaseName
          AND backup_finish_date IS NOT NULL
        GROUP BY backup_start_date, type, compressed_backup_size, backup_size
        ORDER BY backup_start_date DESC;
        """;

    public async Task<IReadOnlyList<BackupListItemViewModel>> GetBackupsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        var connectionString = configuration.GetConnectionString("Default");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return [];
        }

        var builder = new SqlConnectionStringBuilder(connectionString);
        var databaseName = string.IsNullOrWhiteSpace(builder.InitialCatalog)
            ? "JiuDiary"
            : builder.InitialCatalog;

        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new SqlCommand(BackupQuery, connection)
        {
            CommandTimeout = 10
        };
        command.Parameters.AddWithValue("@Limit", Math.Clamp(limit, 1, 100));
        command.Parameters.AddWithValue("@DatabaseName", databaseName);

        var backups = new List<BackupListItemViewModel>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            backups.Add(new BackupListItemViewModel
            {
                BackupDate = reader.GetDateTime(0),
                Type = GetBackupType(reader.GetString(1)),
                SizeBytes = reader.IsDBNull(2) ? 0 : Convert.ToInt64(reader.GetValue(2)),
                Device = reader.IsDBNull(3) ? string.Empty : reader.GetString(3)
            });
        }

        return backups;
    }

    private static string GetBackupType(string type) => type switch
    {
        "D" => "Полная копия",
        "I" => "Дифференциальная",
        "L" => "Журнал транзакций",
        _ => "Другая"
    };
}
