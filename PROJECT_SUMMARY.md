# Invoice³ - Project Summary

## 📁 Directory Structure

```
Invoice3_v5/
├── README.md                    # Main documentation
├── QUICKSTART.md               # 5-minute setup guide
├── CONTRIBUTING.md             # Contribution guidelines
├── LICENSE                     # MIT License
├── PROJECT_SUMMARY.md         # This file
├── .gitignore                 # Git ignore rules
│
├── backend/                   # Python FastAPI Backend
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   │   ├── invoices.py   # Invoice CRUD + upload
│   │   │   └── chat.py       # AI chat interface
│   │   ├── services/         # Business logic
│   │   │   ├── ade_service.py              # LandingAI extraction
│   │   │   ├── agentic_validation_service.py  # LangGraph agents
│   │   │   ├── llm_service.py              # Gemini integration
│   │   │   └── rag_service.py              # RAG/Chat
│   │   ├── models.py         # Pydantic data models
│   │   ├── database.py       # DB interface (SQLite/PostgreSQL)
│   │   ├── config.py         # Configuration management
│   │   ├── db_interface.py   # Database adapter pattern
│   │   └── main.py           # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   └── .env.example         # Environment template
│
├── frontend/                 # React TypeScript Frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── invoice/    # Invoice-specific UI
│   │   │   ├── layout/     # App shell (header, sidebar)
│   │   │   └── ui/         # Reusable components (Shadcn/UI)
│   │   ├── pages/          # Page-level components
│   │   │   ├── EliteDashboard.tsx
│   │   │   └── InvoiceDetailEnhanced.tsx
│   │   ├── lib/            # Utilities
│   │   │   ├── api.ts      # API client
│   │   │   ├── invoice-api.ts  # Invoice-specific API
│   │   │   └── types.ts    # TypeScript interfaces
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts
│   │   └── main.tsx        # App entry point
│   ├── package.json        # Node dependencies
│   ├── tsconfig.json       # TypeScript config
│   ├── vite.config.ts      # Vite bundler config
│   ├── tailwind.config.js  # Tailwind CSS config
│   └── .env.example        # Environment template
│
└── docs/                    # Additional documentation
```

## 🎯 Core Components

### Backend Services

| Service | Purpose | Technology |
|---------|---------|------------|
| **ADE Service** | Extract 40+ fields from invoice images | LandingAI ADE API |
| **Agentic Validation** | 3-way matching + fraud detection | LangGraph + Gemini 2.0 |
| **LLM Service** | General LLM operations | Google Gemini |
| **RAG Service** | Conversational AI for invoices | Vector embeddings + Gemini |

### Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/` | Main invoice list & metrics |
| **Invoice Detail** | `/invoices/:id` | Detailed view with validation results |
| **Upload** | `/upload` | Drag & drop invoice upload |
| **Chat** | `/chat` | AI assistant for querying data |
| **Analytics** | `/analytics` | Processing metrics & insights |

## 🔄 Data Flow

```
1. User uploads invoice (PDF/image)
   ↓
2. FastAPI receives file → creates database record
   ↓
3. Background task starts:
   a. ADE Service extracts fields (15-20s)
   b. LangGraph agents validate (20-25s)
      - Matching Agent: Compare vs PO/GRN
      - Fraud Agent: Risk analysis
   c. Final recommendation: APPROVE/NEEDS_REVIEW/REJECT
   ↓
4. Database updated with results
   ↓
5. Frontend polls/updates UI automatically
```

## 🗄️ Database Schema

### Core Tables
- **invoices** - Invoice records with extracted data
- **purchase_orders** - PO master data
- **goods_receipts** - GRN records
- **vendors** - Vendor profiles with risk history
- **chat_messages** - AI chat conversation history

## 🚀 Key Features

### For End Users
- ✅ Drag & drop invoice upload
- ✅ Real-time processing status
- ✅ Visual 3-way matching comparison
- ✅ Fraud risk breakdown with explanations
- ✅ AI chat assistant
- ✅ Dark mode UI

### For Developers
- ✅ Clean separation of concerns
- ✅ Type-safe APIs (Pydantic + TypeScript)
- ✅ Async processing with FastAPI BackgroundTasks
- ✅ Extensible agent architecture
- ✅ RESTful API with OpenAPI docs
- ✅ React + TypeScript + Tailwind CSS

## 🧪 Testing

```bash
# Backend
cd backend
pytest tests/

# Frontend
cd frontend
npm test
```

## 📦 Dependencies

### Backend (Python 3.10+)
- FastAPI - Web framework
- LangGraph - Agent orchestration
- google-generativeai - Gemini SDK
- landingai - Document AI
- SQLAlchemy - ORM (optional)
- Pydantic - Data validation

### Frontend (Node 18+)
- React 18 - UI framework
- TypeScript - Type safety
- Vite - Build tool
- Tailwind CSS - Styling
- Shadcn/UI - Component library
- React Query - Data fetching
- Recharts - Charts

## 🔐 Environment Variables

### Backend (.env)
```bash
LANDINGAI_API_KEY=required
GEMINI_API_KEY=required
DATABASE_URL=sqlite:///invoice3.db (default)
LOG_LEVEL=INFO
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000
```

## 🎓 Learning Path for Junior Developers

### Day 1: Setup & Basic Understanding
1. Follow QUICKSTART.md
2. Explore the dashboard UI
3. Upload a test invoice
4. Read README.md architecture section

### Day 2: Backend Exploration
1. Read `backend/app/main.py` - Entry point
2. Check `api/invoices.py` - How upload works
3. Look at `services/ade_service.py` - Document extraction
4. Understand `services/agentic_validation_service.py` - Agent flow

### Day 3: Frontend Exploration
1. Start with `frontend/src/main.tsx`
2. Look at `pages/EliteDashboard.tsx`
3. Check `components/invoice/` - UI components
4. Understand `lib/invoice-api.ts` - API calls

### Day 4: Make Your First Contribution
1. Pick a "good first issue" from GitHub
2. Fork the repo
3. Make your changes
4. Follow CONTRIBUTING.md guidelines

## 📊 Performance Metrics

- **Extraction Time**: 15-20 seconds
- **Validation Time**: 20-25 seconds
- **Total Processing**: ~45 seconds
- **Accuracy**: 95%+ field extraction
- **False Positive Rate**: <5%

## 🛣️ Future Roadmap

- [ ] Batch processing
- [ ] Email integration
- [ ] Mobile app
- [ ] ERP connectors (SAP, Oracle)
- [ ] Multi-language support
- [ ] Advanced analytics

## 💡 Design Decisions

### Why LangGraph?
- Structured agent workflow
- Easy to debug and visualize
- Scales well with complexity

### Why Gemini 2.0 Flash?
- Fast inference (<2s per agent)
- Cost-effective
- Excellent JSON output reliability

### Why SQLite default?
- Zero configuration
- Perfect for demos and small deployments
- Easy to migrate to PostgreSQL

### Why React + TypeScript?
- Industry standard
- Type safety catches bugs early
- Great developer experience

## 📞 Getting Help

1. Check [QUICKSTART.md](QUICKSTART.md) for common issues
2. Read [README.md](README.md) for detailed docs
3. Search existing GitHub issues
4. Ask in GitHub Discussions
5. Open a new issue with details

---

**Invoice³** - Built with ❤️ by **Subash Natarajan**

👨‍💻 Connect with the author:
- LinkedIn: https://www.linkedin.com/in/subashn/
- Email: suboss87@gmail.com

*Created for the LandingAI Financial Hackathon 2024*
