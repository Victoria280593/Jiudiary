# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["admin/JiuDiary.Admin.csproj", "admin/"]
COPY ["libs/DataBase/JiuDiary.DataBase.csproj", "libs/DataBase/"]
COPY ["libs/JiraDiary.AspCore/JiraDiary.AspCore.csproj", "libs/JiraDiary.AspCore/"]
RUN dotnet restore "admin/JiuDiary.Admin.csproj"

COPY ["admin/", "admin/"]
COPY ["libs/", "libs/"]
WORKDIR /src/admin
RUN dotnet publish "JiuDiary.Admin.csproj" \
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
ENTRYPOINT ["dotnet", "JiuDiary.Admin.dll"]
