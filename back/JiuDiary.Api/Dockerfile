# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["JiuDiary.Api/JiuDiary.Api.csproj", "JiuDiary.Api/"]
RUN dotnet restore "JiuDiary.Api/JiuDiary.Api.csproj"

COPY ["JiuDiary.Api/", "JiuDiary.Api/"]
WORKDIR /src/JiuDiary.Api
RUN dotnet publish "JiuDiary.Api.csproj" \
    --configuration Release \
    --output /app/publish \
    --no-restore \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_HTTP_PORTS=8080 \
    DOTNET_RUNNING_IN_CONTAINER=true

EXPOSE 8080

COPY --from=build /app/publish .

USER $APP_UID
ENTRYPOINT ["dotnet", "JiuDiary.Api.dll"]
