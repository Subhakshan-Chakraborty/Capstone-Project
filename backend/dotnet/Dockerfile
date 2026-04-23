# STAGE 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /app

COPY . .

RUN dotnet restore
RUN dotnet publish -c Release -o /out

# STAGE 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0

WORKDIR /app

COPY --from=build /out .

CMD ["dotnet", "dotnet.dll"]