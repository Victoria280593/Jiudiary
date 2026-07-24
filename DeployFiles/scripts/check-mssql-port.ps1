param(
    [Parameter(Mandatory = $true)]
    [string]$ServerIp,
    [int]$Port = 1433
)

Test-NetConnection -ComputerName $ServerIp -Port $Port |
    Select-Object ComputerName, RemotePort, TcpTestSucceeded

