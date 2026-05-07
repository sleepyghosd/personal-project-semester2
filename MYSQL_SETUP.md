# MySQL Database Setup Instructions

## 1. Install MySQL Server

### Windows
Download from: https://dev.mysql.com/downloads/mysql/
Or use: `choco install mysql`

### macOS
```bash
brew install mysql
```

### Linux
```bash
sudo apt-get install mysql-server
```

## 2. Create Database

Start MySQL and run:
```sql
CREATE DATABASE gamestats;
```

## 3. Install Python Packages

```bash
pip install -r requirements.txt
```

## 4. Configure Connection

### Option A: Modify app.py (local development)
Edit line in `app.py`:
```python
DB_URL = 'mysql+pymysql://root:password@localhost:3306/gamestats'
```
Replace `root` and `password` with your MySQL credentials.

### Option B: Use Environment Variable (recommended for production)
```bash
# Windows PowerShell
$env:DATABASE_URL = "mysql+pymysql://root:password@localhost:3306/gamestats"

# Windows Command Prompt
set DATABASE_URL=mysql+pymysql://root:password@localhost:3306/gamestats

# Linux/macOS
export DATABASE_URL="mysql+pymysql://root:password@localhost:3306/gamestats"
```

## 5. Run the App

```bash
python app.py
```

The tables will be created automatically on first run.

## Connection String Format

```
mysql+pymysql://[username]:[password]@[host]:[port]/[database]
```

**Example:**
```
mysql+pymysql://root:mypassword@localhost:3306/gamestats
```

## Troubleshooting

### "Access denied for user 'root'@'localhost'"
- Check your MySQL username and password
- Make sure MySQL service is running

### "Can't connect to MySQL server"
- Verify MySQL is installed and running
- Check host and port are correct (usually localhost:3306)

### "Unknown database 'gamestats'"
- Create the database first with: `CREATE DATABASE gamestats;`

## Online Deployment (Heroku, AWS, etc.)

When deploying online, your hosting provider will give you a DATABASE_URL. Set it as an environment variable:

```bash
heroku config:set DATABASE_URL="mysql+pymysql://user:pass@host/dbname"
```

The app will automatically use this instead of the local connection string.
