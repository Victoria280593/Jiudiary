# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["api/JiuDiary.Api.csproj", "api/"]
COPY ["libs/DataBase/JiuDiary.DataBase.csproj", "libs/DataBase/"]
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

RUN mkdir -p /app/logs /logs/jiuDiary \
    && chown -R $APP_UID:$APP_UID /app/logs /logs/jiuDiary

USER $APP_UID
ENTRYPOINT ["dotnet", "JiuDiary.Api.dll"]
