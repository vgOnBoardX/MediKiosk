from google import genai
from pydantic import BaseModel, Field
from typing import List, Optional
from app.core.config import settings

client = genai.Client(api_key=settings.gemini_api_key)

class Medication(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None

class ParsedEntities(BaseModel):
    diagnoses: List[str] = Field(default_factory=list)
    medications: List[Medication] = Field(default_factory=list)
    abnormalValues: List[str] = Field(default_factory=list)

class OcrResponseSchema(BaseModel):
    documentType: str = Field(description="One of: PRESCRIPTION, LAB_REPORT, DISCHARGE_SUMMARY, OTHER")
    parsedEntities: ParsedEntities

SYSTEM_INSTRUCTION = """You are a clinical document OCR and extraction AI for the Sanjeevani AI-OS system.
Analyze the provided medical document (image or PDF).
Extract structured information into the requested JSON format."""

def extract_clinical_data_from_document(document_url: str) -> dict:
    """
    Downloads/streams the document and uses Gemini 2.0 Flash to extract structured clinical data.
    """
    try:
        # In a real implementation, you would download the document from `document_url`
        # and upload it via `client.files.upload` or pass the bytes. 
        # For scaffolding, we simulate the text prompt asking Gemini to extract.
        
        # simulated_file = client.files.upload(file='path/to/downloaded/file.jpg')
        
        prompt = f"Analyze the medical document at {document_url}. Extract the document type, diagnoses, medications, and abnormal lab values."
        
        response = client.models.generate_content(
            model='gemini-2.5-flash', # Or gemini-2.0-flash
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=OcrResponseSchema,
                temperature=0.1
            ),
        )
        
        return response.parsed
    except Exception as e:
        print(f"Error in Gemini OCR: {e}")
        return {
            "documentType": "OTHER",
            "parsedEntities": {
                "diagnoses": [],
                "medications": [],
                "abnormalValues": []
            }
        }
