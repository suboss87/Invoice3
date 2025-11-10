# ⚡ Quick Start Guide - Invoice³

**Get up and running in 5 minutes!**

## Step 1: Get Your API Keys

### LandingAI API Key
1. Go to https://landing.ai
2. Sign up or log in
3. Navigate to API Keys section
4. Copy your API key

### Google Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

## Step 2: Set Up Backend

```bash
# Navigate to backend folder
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (takes ~2 minutes)
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env

# Edit .env file and paste your API keys
nano .env  # Or use any text editor

# Should look like:
# LANDINGAI_API_KEY=land_sk_xxxxxxxx
# GEMINI_API_KEY=AIzaSyxxxxxxxx
```

## Step 3: Start Backend

```bash
# Still in backend folder with venv activated
python -m app.main
```

You should see:
```
🚀 Starting Invoice³ API v3.0.0
✅ Configuration validated
✅ Database initialized
✨ Ready to process invoices!
```

**Keep this terminal open!**

## Step 4: Set Up Frontend

Open a **new terminal** window:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (takes ~3 minutes)
npm install

# Create .env file
cp .env.example .env

# No need to edit - default is correct!

# Start development server
npm run dev
```

You should see:
```
VITE ready in 500 ms
➜  Local:   http://localhost:5173/
```

## Step 5: Open the App

1. Open your browser
2. Go to **http://localhost:5173**
3. You should see the Invoice³ dashboard!

## Step 6: Process Your First Invoice

1. Click "Upload Invoice" button
2. Drag & drop an invoice PDF/image
3. Wait ~45 seconds for processing
4. View the results!

## 🎉 That's It!

You're now running Invoice³!

## Troubleshooting

### "ModuleNotFoundError" in backend
```bash
# Make sure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

### "command not found: npm"
- Install Node.js from https://nodejs.org
- Version 18 or higher required

### "API connection failed" in frontend
- Make sure backend is running on port 8000
- Check backend terminal for errors

### Port already in use
```bash
# Backend (port 8000)
lsof -ti:8000 | xargs kill -9

# Frontend (port 5173)
lsof -ti:5173 | xargs kill -9
```

## What's Next?

- Read the full [README.md](README.md) for advanced features
- Check [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
- Explore the API docs at http://localhost:8000/docs

## Sample Invoice Data

The system comes pre-loaded with:
- 8 Purchase Orders
- 8 Goods Receipt Notes
- 6 Vendors

Upload any invoice that references these PO numbers:
- PO-2024-001 (Acme Corporation)
- PO-2024-003 (Tech Supplies)
- PQ-2024-1978 (Northeast Facilities)

Happy invoicing! 🚀

---

**Created by Subash Natarajan** | [LinkedIn](https://www.linkedin.com/in/subashn/) | suboss87@gmail.com
