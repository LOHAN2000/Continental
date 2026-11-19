FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY ["Continental.Api.csproj", "./"]

RUN dotnet restore "Continental.Api.csproj"

COPY . .

RUN dotnet publish "Continental.Api.csproj" \
--configuration Release \
--output /app/publish \
--no-restore \
/p:UseAppHost=false


FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:10000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 10000

ENTRYPOINT ["dotnet", "Continental.Api.dll"]