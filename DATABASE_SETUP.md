# 🔧 Database Setup Guide

## Option 1: PostgreSQL with Docker (Recommended)

### Install Docker Desktop for Windows:
1. Download from: https://www.docker.com/products/docker-desktop/
2. Install and restart your computer
3. Run: `docker-compose up -d` in project directory

## Option 2: PostgreSQL Direct Installation

### Install PostgreSQL:
```powershell
# Using winget
winget install PostgreSQL.PostgreSQL

# Or download from: https://www.postgresql.org/download/windows/
```

### After installation:
1. Open pgAdmin or use psql
2. Create database: `CREATE DATABASE synapse;`
3. Create user: `CREATE USER synapse_user WITH PASSWORD 'synapse_password';`
4. Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE synapse TO synapse_user;`
5. Enable pgvector extension (follow: https://github.com/pgvector/pgvector)

## Option 3: Use Mock Database (Development Only)

For quick testing, we'll use an in-memory mock that simulates PostgreSQL with vector support.

**Current Status**: Using mock database for development. Install PostgreSQL for production!
