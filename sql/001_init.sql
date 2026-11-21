-- Noble Property Management | Database migration 001
-- Execute ONCE against the target Azure SQL database (SSMS, Azure Data Studio, or sqlcmd).
-- Designed for a dedicated, private database. SQL user running migration needs CREATE TABLE rights.

IF OBJECT_ID('dbo.Property','U') IS NULL
BEGIN
  CREATE TABLE dbo.Property (
    PropertyId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Property PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Name NVARCHAR(120) NOT NULL,
    PropertyType VARCHAR(30) NOT NULL
      CONSTRAINT CK_Property_Type CHECK (PropertyType IN ('PRIMARY','LONG_TERM_RENTAL','SHORT_TERM_RENTAL')),
    AddressLine1 NVARCHAR(200) NOT NULL,
    City NVARCHAR(100) NOT NULL,
    [State] NVARCHAR(50) NOT NULL,
    PostalCode NVARCHAR(20) NOT NULL,
    CountryCode CHAR(2) NOT NULL CONSTRAINT DF_Property_Country DEFAULT ('US'),
    AcquisitionDate DATE NULL,
    PurchasePrice DECIMAL(19,2) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Property_IsActive DEFAULT (1),
    CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Property_Created DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Property_Updated DEFAULT SYSUTCDATETIME()
  );
END;
GO

IF OBJECT_ID('dbo.MaintenanceTask','U') IS NULL
BEGIN
  CREATE TABLE dbo.MaintenanceTask (
    TaskId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_MaintenanceTask PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    PropertyId UNIQUEIDENTIFIER NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [Priority] VARCHAR(10) NOT NULL CONSTRAINT DF_MaintenanceTask_Priority DEFAULT ('MEDIUM')
      CONSTRAINT CK_MaintenanceTask_Priority CHECK ([Priority] IN ('LOW','MEDIUM','HIGH','URGENT')),
    [Status] VARCHAR(20) NOT NULL CONSTRAINT DF_MaintenanceTask_Status DEFAULT ('OPEN')
      CONSTRAINT CK_MaintenanceTask_Status CHECK ([Status] IN ('OPEN','IN_PROGRESS','BLOCKED','COMPLETED','CANCELLED')),
    DueDate DATE NULL,
    CompletedAt DATETIME2(3) NULL,
    EstimatedCost DECIMAL(19,2) NULL,
    ActualCost DECIMAL(19,2) NULL,
    CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_MaintenanceTask_Created DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_MaintenanceTask_Updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_MaintenanceTask_Property FOREIGN KEY (PropertyId) REFERENCES dbo.Property(PropertyId)
  );
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MaintenanceTask_Property_Status' AND object_id = OBJECT_ID('dbo.MaintenanceTask'))
  CREATE INDEX IX_MaintenanceTask_Property_Status ON dbo.MaintenanceTask (PropertyId, [Status], DueDate);
GO

IF OBJECT_ID('dbo.FinancialTransaction','U') IS NULL
BEGIN
  CREATE TABLE dbo.FinancialTransaction (
    TransactionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_FinancialTransaction PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    PropertyId UNIQUEIDENTIFIER NOT NULL,
    TransactionDate DATE NOT NULL,
    TransactionType VARCHAR(20) NOT NULL
      CONSTRAINT CK_FinancialTransaction_Type CHECK (TransactionType IN ('INCOME','EXPENSE','CAPITAL','PRINCIPAL','TRANSFER')),
    Category NVARCHAR(100) NOT NULL,
    Amount DECIMAL(19,2) NOT NULL CONSTRAINT CK_FinancialTransaction_Amount CHECK (Amount >= 0),
    [Description] NVARCHAR(500) NULL,
    CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_FinancialTransaction_Created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_FinancialTransaction_Property FOREIGN KEY (PropertyId) REFERENCES dbo.Property(PropertyId)
  );
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FinancialTransaction_Property_Date' AND object_id = OBJECT_ID('dbo.FinancialTransaction'))
  CREATE INDEX IX_FinancialTransaction_Property_Date ON dbo.FinancialTransaction (PropertyId, TransactionDate);
GO

IF OBJECT_ID('dbo.PropertyValuation','U') IS NULL
BEGIN
  CREATE TABLE dbo.PropertyValuation (
    ValuationId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PropertyValuation PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    PropertyId UNIQUEIDENTIFIER NOT NULL,
    AsOfDate DATE NOT NULL,
    EstimatedValue DECIMAL(19,2) NOT NULL,
    SourceName NVARCHAR(100) NOT NULL,
    Notes NVARCHAR(500) NULL,
    CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_PropertyValuation_Created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_PropertyValuation_Property FOREIGN KEY (PropertyId) REFERENCES dbo.Property(PropertyId)
  );
END;
GO

IF OBJECT_ID('dbo.Mortgage','U') IS NULL
BEGIN
  CREATE TABLE dbo.Mortgage (
    MortgageId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Mortgage PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    PropertyId UNIQUEIDENTIFIER NOT NULL,
    LenderName NVARCHAR(150) NULL,
    OriginalPrincipal DECIMAL(19,2) NULL,
    InterestRatePct DECIMAL(8,5) NULL,
    StartDate DATE NULL,
    MaturityDate DATE NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Mortgage_Active DEFAULT (1),
    CONSTRAINT FK_Mortgage_Property FOREIGN KEY (PropertyId) REFERENCES dbo.Property(PropertyId)
  );
END;
GO
