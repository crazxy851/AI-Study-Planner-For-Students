import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from rag import process_pdf, ask_question

app = FastAPI(title="StudyBuddy v2 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        process_pdf(file_path)
        return {"message": f"Successfully processed '{file.filename}'. You can now ask questions!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")


@app.post("/chat")
async def chat(question: str = Form(...)):
    try:
        answer = ask_question(question)
        return {"answer": answer}
    except Exception as e:
        error_msg = str(e)
        # Give a helpful message if Ollama isn't running
        if "connection" in error_msg.lower() or "refused" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail="Cannot connect to Ollama. Please make sure Ollama is running: open a terminal and run 'ollama run llama3'"
            )
        raise HTTPException(status_code=500, detail=f"Error: {error_msg}")


@app.get("/health")
async def health():
    return {"status": "ok"}
