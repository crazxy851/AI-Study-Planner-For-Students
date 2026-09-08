# StudyBuddy AI 📚

An AI-powered study assistant that lets you upload PDF documents and chat with them using a local LLM — no internet or paid API required.

## ✨ Features
- 📄 Upload PDF lecture notes, textbooks, or syllabi
- 💬 Chat with your documents using RAG (Retrieval-Augmented Generation)
- 🏠 100% local — powered by Ollama + ChromaDB + LangChain
- ⚡ Beautiful dark UI with glassmorphism design

## 🧱 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | FastAPI, LangChain, ChromaDB |
| LLM | Ollama (smollm2:135m — only 90MB!) |
| Embeddings | ChromaDB built-in ONNX embeddings |

## 🚀 Getting Started

### Prerequisites
- [Python 3.10+](https://python.org)
- [Node.js 18+](https://nodejs.org)
- [Ollama](https://ollama.com) — install and run the model:

```bash
ollama run smollm2:135m
```

### Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```
Backend runs at: `http://localhost:8000`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

## 📁 Project Structure
```
├── backend/
│   ├── main.py          # FastAPI routes
│   ├── rag.py           # LangChain RAG pipeline
│   ├── requirements.txt
│   └── uploaded_docs/   # Uploaded PDFs (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main UI component
│   │   └── index.css    # Global styles
│   └── package.json
└── README.md
```

## 🌐 Deployment

### Frontend → Vercel
The frontend is deployed on Vercel. Visit the live demo:
**[Live Demo](https://ai-study-planner-for-students.vercel.app)**

### Backend → Run Locally
Since the backend uses a local LLM (Ollama), it must run on your machine.
Make sure Ollama is running before starting the backend.

## 📝 License
MIT
