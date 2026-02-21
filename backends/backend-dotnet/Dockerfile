FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["TalentSphere.API.csproj", "./"]
RUN dotnet restore "TalentSphere.API.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "TalentSphere.API.csproj" -c Release -o /app/build
RUN dotnet publish "TalentSphere.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
# Install ffmpeg for video transcoding
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .
EXPOSE 8080
# Note: Container default port is usually 8080 for .NET 8
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "TalentSphere.API.dll"]
