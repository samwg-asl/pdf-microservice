FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

# Clean, segmented package installer designed for .NET 9 (Debian Bookworm base)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libnss3 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Point PuppeteerSharp to the system chromium instance
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["PdfMicroservice.csproj", "./"]
RUN dotnet restore "./PdfMicroservice.csproj"
COPY . .
RUN dotnet build "PdfMicroservice.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "PdfMicroservice.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "PdfMicroservice.dll"]