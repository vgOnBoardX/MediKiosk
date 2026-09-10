from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.triage_agent import generate_triage_turn
from app.services.ocr_agent import extract_clinical_data_from_document
from app.services.rag_agent import synthesize_patient_history

router = APIRouter(prefix="/api/v1/ai", tags=["AI Engine"])

class Message(BaseModel):
    role: str
    content: str

class TriageRequest(BaseModel):
    patient_input: str
    language: Optional[str] = "English"
    conversation_history: Optional[List[Message]] = []

class OcrRequest(BaseModel):
    document_url: str

class HistoryRequest(BaseModel):
    patient_id: str
    query: str

@router.post("/triage-turn")
def triage_turn_endpoint(request: TriageRequest):
    """
    Handles a single conversational turn in the triage process.
    Powered by Groq & Llama-3.
    """
    # Convert Pydantic models to dicts for the service
    history_dicts = [{"role": m.role, "content": m.content} for m in request.conversation_history]
    
    result = generate_triage_turn(request.patient_input, history_dicts, request.language)
    return {"status": "success", "data": result}

@router.post("/ocr-extract")
def ocr_extract_endpoint(request: OcrRequest):
    """
    Gemini 2.5 Flash multi-modal medical document OCR.
    """
    result = extract_clinical_data_from_document(request.document_url)
    return {
        "status": "success",
        "data": result
    }

@router.post("/synthesize-history")
def synthesize_history_endpoint(request: HistoryRequest):
    """
    Qdrant/RAG powered patient history synthesis.
    """
    summary = synthesize_patient_history(request.patient_id, request.query)
    return {
        "status": "success",
        "data": {
            "summary": summary
        }
    }
