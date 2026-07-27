# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["api/JiuDiary.Api.csproj", "api/"]
COPY ["libs/database/JiuDiary.Database.csproj", "libs/database/"]
COPY ["libs/models/JiuDiary.Models.csproj", "libs/models/"]
RUN dotnet restore "api/JiuDiary.Api.csproj"

COPY ["api/", "api/"]
COPY ["libs/", "libs/"]
WORKDIR /src/api
RUN dotnet publish "JiuDiary.Api.csproj" \
    --configuration Release \
    --output /app/publish \
    --no-restore \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_HTTP_PORTS=8080 \
    DOTNET_RUNNING_IN_CONTAINER=true \
    TZ=Europe/Moscow

EXPOSE 8080

COPY --from=build /app/publish .

USER $APP_UID
ENTRYPOINT ["dotnet", "JiuDiary.Api.dll"]
