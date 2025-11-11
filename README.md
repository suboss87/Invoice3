# Invoice³ (Invoice Cube) - AI-Powered Invoice Processing System

> **3-Way Matching + Fraud Detection + Autonomous Validation**

Invoice³ is an enterprise-grade, AI-powered invoice processing system that automates 3-way matching (Invoice ↔ PO ↔ GRN), fraud detection, and validation workflows using cutting-edge AI technologies.

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18.2-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.104-green.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Overview
Invoice³ combines three powerful AI technologies to create a fully automated invoice validation pipeline:

1. **LandingAI ADE** - Advanced document extraction
2. **LangGraph** - Agentic workflow orchestration
3. **Google Gemini 2.0 Flash** - LLM-powered validation

## ✨ Features
### Core Capabilities
- 🔍 **Intelligent Document Extraction** - Extract 40+ fields from invoice images/PDFs
- 🔄 **3-Way Matching** - Automated matching against PO and GRN data
- 🛡️ **Fraud Detection** - Real-time risk analysis with 4 security checks
- 🤖 **Autonomous Agents** - Two specialized agents (Matching + Fraud) working in tandem
- 📊 **Real-Time Dashboard** - Executive dashboard with live metrics
- 📈 **Analytics** - Processing time, quality scores, and ROI tracking

### Technical Highlights
- **Agentic Architecture** - LangGraph-powered multi-agent system
- **Production-Ready** - SQLite/PostgreSQL support, async processing
- **Modern UI** - React + TypeScript + Tailwind CSS + Shadcn/UI
- **API-First** - RESTful API with OpenAPI documentation
- **Extensible** - Easy to add new validators and integrations

## 🏗️ Architecture
<img width="1075" height="427" alt="Screenshot 2025-11-10 at 18 53 42" src="https://github.com/user-attachments/assets/afc0f8c6-1922-4266-8f5d-3a3550790812" />


## 🚀 Quick Start
### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm/yarn
- LandingAI API Key ([Get it here](https://landing.ai))
- Google Gemini API Key ([Get it here](https://makersuite.google.com/app/apikey))

### Installation
#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/invoice3.git
cd invoice3
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env and add your API keys:
# LANDINGAI_API_KEY=your_landingai_key_here
# GEMINI_API_KEY=your_gemini_key_here

# Initialize database
python -m app.main
```

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env if needed (default: http://localhost:8000)
# VITE_API_URL=http://localhost:8000

# Start development server
npm run dev
```

#### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📖 Usage Guide
### Processing Your First Invoice

1. **Upload Invoice**
   - Navigate to the dashboard
   - Click "Upload Invoice" or drag & drop an invoice PDF/image
   - System automatically processes in ~45 seconds

2. **Review Results**
   - View extraction quality metrics
   - Check 3-way matching scores
   - Review fraud risk analysis
   - See recommendation: APPROVE / NEEDS_REVIEW / REJECT

3. **Chat with Data**
   - Click "AI Assistant" in the top navigation
   - Ask questions like:
     - "Show me all rejected invoices"
     - "What invoices are pending from Acme Corp?"
     - "Why was invoice INV-2024-001 flagged?"

### Understanding Recommendations

| Recommendation | Criteria |
|----------------|----------|
| ✅ **APPROVE** | Match score ≥ 85, Risk score < 40, Extraction quality ≥ 70 |
| ⚠️ **NEEDS_REVIEW** | Match score 60-84, Risk score 40-69, or moderate concerns |
| ❌ **REJECT** | Match score < 60, Risk score ≥ 70, or critical issues |

## 🛠️ Development
### Project Structure
```
invoice3/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   │   ├── invoices.py
│   │   │   └── chat.py
│   │   ├── services/      # Business logic
│   │   │   ├── ade_service.py          # Document extraction
│   │   │   ├── agentic_validation_service.py  # LangGraph agents
│   │   │   ├── llm_service.py          # Gemini integration
│   │   │   └── rag_service.py          # Chat/RAG
│   │   ├── models.py      # Data models
│   │   ├── database.py    # Database adapter
│   │   ├── config.py      # Configuration
│   │   └── main.py        # FastAPI app
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── invoice/   # Invoice-specific components
│   │   │   ├── layout/    # App layout
│   │   │   └── ui/        # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API clients
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
│   ├── package.json
│   └── .env.example
│
├── docs/                  # Additional documentation
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

### Key Technologies
#### Backend
- **FastAPI** - Modern, fast web framework
- **LangGraph** - Agent orchestration framework
- **Google Gemini 2.0 Flash** - LLM for validation logic
- **LandingAI ADE** - Document AI extraction
- **SQLite/PostgreSQL** - Database
- **Pydantic** - Data validation

#### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Component library
- **React Query** - Data fetching
- **Recharts** - Visualizations

#### Dashboard 
<img width="1408" height="942" alt="Screenshot 2025-11-11 at 11 19 44" src="https://github.com/user-attachments/assets/c4b03b5d-bb6f-4c88-9ab4-79cfe4fef264" />
<img width="1609" height="717" alt="Screenshot 2025-11-11 at 11 24 08" src="https://github.com/user-attachments/assets/8689fbec-4c3f-48d1-bc65-9234998cc017" />

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Building for Production
#### Backend
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm run build
# Serve dist/ directory with nginx or similar
```

## 🔧 Configuration
### Backend Environment Variables
```bash
# Required
LANDINGAI_API_KEY=your_landingai_api_key
GEMINI_API_KEY=your_gemini_api_key

# Optional
DATABASE_URL=sqlite:///invoice3.db  # Or postgresql://...
LOG_LEVEL=INFO
MAX_UPLOAD_SIZE_MB=10
```

### Frontend Environment Variables
```bash
VITE_API_URL=http://localhost:8000  # Backend API URL
```

## 📊 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices/` | List all invoices |
| POST | `/api/invoices/upload` | Upload new invoice |
| GET | `/api/invoices/{id}` | Get invoice details |
| GET | `/api/stats` | Get system statistics |

## 🧪 Testing with Synthetic Data

Invoice³ comes pre-loaded with **realistic test data** so you can try it immediately without creating purchase orders or vendor records.

### 📊 Included Test Data
The database (`backend/invoice3.db`) contains:

- **8 Purchase Orders** - Various vendors and amounts
- **8 Goods Receipt Notes** - Matching PO deliveries
- **6 Vendor Profiles** - Complete with bank details and history

## 🤝 Contributing
We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
- Built for the **LandingAI Financial Hackathon 2024**
- Powered by [LandingAI ADE](https://landing.ai)
- Powered by [Google Gemini](https://deepmind.google/technologies/gemini/)
- Built with [LangGraph](https://github.com/langchain-ai/langgraph)

## 👨‍💻 Author
**Subash Natarajan**
- 💼 LinkedIn: [linkedin.com/in/subashn](https://www.linkedin.com/in/subashn/)
- 📧 Email: suboss87@gmail.com
- 🌐 Portfolio: Coming soon

## 📞 Support

- 📧 Email: suboss87@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/invoice3/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/invoice3/discussions)

## 🗺️ Roadmap

- [ ] AI Chat Assistant
- [ ] Integration with ERP systems (SAP, Oracle, NetSuite)
- [ ] Advanced analytics dashboard
- [ ] Mobile app (iOS/Android)
- [ ] Email ingestion

---

**Made with ❤️ by Subash Natarajan** | [LinkedIn](https://www.linkedin.com/in/subashn/) | [Email](mailto:suboss87@gmail.com)

*Built for the LandingAI Financial Hackathon 2025*
