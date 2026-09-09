import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from dotenv import load_dotenv

load_dotenv()

# ChromaDB's built-in ONNX embeddings — no PyTorch needed
class ChromaDefaultEmbeddings:
    def __init__(self):
        self._fn = DefaultEmbeddingFunction()
    def embed_documents(self, texts):
        return self._fn(texts)
    def embed_query(self, text):
        return self._fn([text])[0]

embeddings = ChromaDefaultEmbeddings()

# In-memory Chroma (works on any free host — user re-uploads PDF per session)
_vectorstore = None

PROMPT_TEMPLATE = """You are an intelligent academic tutor. Use the provided context to answer the user's question clearly and accurately.
If the answer is not in the context, say "I cannot find the answer in the provided documents." Do not make up information.

Context:
{context}

Question: {question}
Answer:"""

QA_PROMPT = PromptTemplate(template=PROMPT_TEMPLATE, input_variables=["context", "question"])


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


def process_pdf(file_path: str):
    global _vectorstore

    loader = PyPDFLoader(file_path)
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)

    # Build an in-memory vector store (no disk persistence needed)
    _vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
    )
    return True


def ask_question(question: str):
    global _vectorstore

    if _vectorstore is None:
        return "⚠️ Please upload a PDF document first before asking questions."

    retriever = _vectorstore.as_retriever(search_kwargs={"k": 4})

    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        return "⚠️ GEMINI_API_KEY is not set. Please add it to your environment variables on Render."

    # Google Gemini API is incredibly stable and has a huge free tier
    llm = ChatGoogleGenerativeAI(
        model="gemini-pro",
        temperature=0,
        google_api_key=gemini_api_key,
    )

    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | QA_PROMPT
        | llm
        | StrOutputParser()
    )

    return chain.invoke(question)
