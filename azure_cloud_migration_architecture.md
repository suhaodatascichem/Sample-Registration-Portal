# Azure Cloud Architecture & Enterprise Migration Strategy

## 1. Overview & Architectural Vision

This document details the technical migration roadmap for transitioning the **Multimodal Lab Sample Registration Portal** from a local development environment (local PC, SQLite database, personal API tokens) to a production-grade **Microsoft Azure Cloud** infrastructure.

The target cloud architecture provides enterprise-grade scalability, zero-trust security, strict data privacy compliance (GDPR, PII zero-data-logging), and high availability.

```mermaid
flowchart TD
    subgraph External["External Web & B2B Ingestion"]
        U1["External Customers (Web Portal)"]
        U2["Customer LIMS / ERP (Machine-to-Machine REST API)"]
        U3["Lab Personnel & Internal Staff"]
    end

    subgraph AzureEdge["Azure Security & Networking Layer"]
        FD["Azure Front Door / Global CDN"]
        APIM["Azure API Management (APIM)"]
        WAF["Azure Web Application Firewall (WAF)"]
    end

    subgraph AzureCompute["Azure Application Core"]
        SWA["Azure Static Web Apps (Next.js Frontend)"]
        ACA["Azure Container Apps (FastAPI Microservices)"]
        KV["Azure Key Vault (Secrets & Managed Keys)"]
        Entra["Microsoft Entra ID (Enterprise SSO & External B2C)"]
    end

    subgraph AzureAI["Azure Enterprise AI Layer (GDPR Compliant)"]
        AOAI["Azure OpenAI Service (GPT-4o Multimodal Vision & Text)"]
        Speech["Azure AI Speech (Multilingual Audio Transcription)"]
    end

    subgraph AzureData["Azure Enterprise Data Layer"]
        PG["Azure Database for PostgreSQL (Flexible Server)"]
        Blob["Azure Blob Storage (Sample Images & Document PDFs)"]
    end

    subgraph OnPrem["Enterprise LIMS Core Network"]
        Gateway["Azure Hybrid Connection / ExpressRoute Tunnel"]
        LIMS["Enterprise STARLIMS Core Database"]
    end

    U1 --> FD --> SWA
    U2 --> WAF --> APIM --> ACA
    U3 --> Entra --> SWA
    SWA --> ACA
    ACA --> KV & Entra
    ACA --> AOAI & Speech
    ACA --> PG & Blob
    ACA --> Gateway --> LIMS
```

---

## 2. Component Mapping: Local PC to Azure Cloud Services

| Application Layer | Development Setup (Current) | Target Azure Cloud Service | Value & Capabilities |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | Next.js on `localhost:3000` | **Azure Static Web Apps** | Native Next.js SSR/ISR support, global edge CDN caching, automated CI/CD deployment pipelines. |
| **Backend API** | FastAPI / Uvicorn on `localhost:8000` | **Azure Container Apps** | Serverless microservice containers with dynamic auto-scaling (KEDA) based on HTTP traffic. |
| **Database** | SQLite (`app.db`) | **Azure Database for PostgreSQL** | Enterprise ACID compliance, automated daily backups, multi-region failover, encryption at rest. |
| **AI Vision & Text** | Personal Gemini API Key | **Azure OpenAI Service (GPT-4o)** | Runs inside private Azure Virtual Network (VNet). Zero data retention, zero model training on customer payloads. |
| **Voice Processing** | Personal Audio API Key | **Azure AI Speech Service** | Enterprise multilingual speech-to-text with customizable noise suppression for lab environments. |
| **B2B API Gateway** | Direct FastAPI routes | **Azure API Management (APIM)** | Handles B2B API Key lifecycle, OAuth2 authorization, rate limiting, and public developer documentation. |
| **Identity & Access** | Local mock authentication | **Microsoft Entra ID** & **Entra External ID** | Single Sign-On (SSO) with Multi-Factor Authentication (MFA) for staff; secure B2C portal for customers. |
| **Secrets & Keys** | Local `.env` file | **Azure Key Vault** + **Managed Identity** | Zero hardcoded keys or passwords. Applications authenticate using Azure System-Assigned Managed Identity. |
| **File Storage** | Local disk / Base64 | **Azure Blob Storage** | Secure storage for sample container photos, packing slips, and digital manifest PDFs with SAS token access. |
| **LIMS Core Sync** | Local CSV exporter | **Azure Hybrid Connection** | Encrypted tunnel bridging cloud microservices to on-premise STARLIMS databases securely. |

---

## 3. Migration Execution Roadmap

```mermaid
timeline
    title Execution Stages: Local Prototype to Azure Enterprise Production
    Stage 1 : Containerization : Create production Dockerfiles for Next.js & FastAPI : Test local multi-container orchestration
    Stage 2 : Azure Provisioning : Provision Azure Resource Group, App Services & PostgreSQL : Configure Azure Key Vault & Networking
    Stage 3 : AI Layer Transition : Enable Azure OpenAI & Speech endpoints : Implement Azure SDK abstraction layer in backend
    Stage 4 : Security & API Gateways : Integrate Microsoft Entra ID (SSO) : Deploy Azure API Management (APIM) for B2B partners
    Stage 5 : Production Launch & LIMS Sync : Connect Azure DevOps CI/CD pipelines : Establish Azure Hybrid Connection to STARLIMS DB
```

### Stage 1: Containerization (Docker)
Dockerize the FastAPI backend and Next.js frontend to standardize execution environments across local development, staging, and Azure cloud environments.

### Stage 2: Database Transition (SQLite $\rightarrow$ Azure PostgreSQL)
Because the application uses **SQLModel / SQLAlchemy**, transitioning from SQLite to Azure PostgreSQL requires changing only the database connection string:

```python
# Development Environment (SQLite)
# DATABASE_URL = "sqlite:///./app.db"

# Production Environment (Azure PostgreSQL Flexible Server)
DATABASE_URL = "postgresql+psycopg2://cloud_admin:Password@app-pg-server.postgres.database.azure.com/sample_portal"
```

### Stage 3: Enterprise AI Integration
Abstract AI service handlers to switch seamlessly between developer keys and enterprise Azure OpenAI instances:

```python
# Service abstraction in app/services/ai_service.py
if settings.USE_AZURE_OPENAI:
    from openai import AzureOpenAI
    client = AzureOpenAI(
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_key=settings.AZURE_OPENAI_KEY,
        api_version="2024-02-01"
    )
```

---

## 4. Key Security & Governance Benefits

1. **Zero-Trust Secret Management**: Managed Identity eliminates the need to store database passwords or API keys in repository configuration files.
2. **GDPR & Regulatory Compliance**: Enterprise Azure AI services guarantee that data processed through vision or voice APIs is not logged, stored, or used for model training.
3. **Cost Efficiency**: Serverless Container Apps scale down to zero when idle, minimizing cloud hosting overhead during non-business hours while scaling automatically during peak registration periods.
