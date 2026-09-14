FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY PaymentService.sln ./
COPY src/PaymentService/PaymentService.csproj src/PaymentService/
COPY tests/PaymentService.Tests/PaymentService.Tests.csproj tests/PaymentService.Tests/
RUN dotnet restore PaymentService.sln

COPY src/ src/
COPY tests/ tests/
RUN dotnet publish src/PaymentService/PaymentService.csproj -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /out ./

EXPOSE 8088
ENV ASPNETCORE_URLS=http://+:8088
ENTRYPOINT ["dotnet", "PaymentService.dll"]
