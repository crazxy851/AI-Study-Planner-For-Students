import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

persist_directory = "chroma_db"

# ChromaDB's built-in ONNX embeddings — no PyTorch/sentence-transformers needed
class ChromaDefaultEmbeddings:
    def __init__(self):
        self._fn = DefaultEmbeddingFunction()

    def embed_documents(self, texts):
        return self._fn(texts)

    def embed_query(self, text):
        return self._fn([text])[0]

embeddings = ChromaDefaultEmbeddings()

PROMPT_TEMPLATE = """You are an intelligent academic tutor. Use the provided context to answer the user's question clearly and accurately.
If the answer is not in the context, say "I cannot find the answer in the provided documents." Do not make up information.

Context:
{context}

Question: {question}
Answer:"""

QA_PROMPT = PromptTemplate(template=PROMPT_TEMPLATE, input_variables=["context", "question"])


def get_vectorstore():
    return Chroma(persist_directory=persist_directory, embedding_function=embeddings)


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


def process_pdf(file_path: str):
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)

    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_directory
    )
    return True


def ask_question(question: str):
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    # smollm2:135m is only ~90MB. Run: ollama run smollm2:135m
    llm = ChatOllama(model="smollm2:135m", temperature=0)

    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | QA_PROMPT
        | llm
        | StrOutputParser()
    )

    return chain.invoke(question)
