import os
import shutil
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.services.ai_service import AIService
from app.schemas import ExtractedBatch, TextInput

router = APIRouter()

from pydantic import BaseModel

class AudioTranscriptResponse(BaseModel):
    text: str

@router.post("/transcribe-audio", response_model=AudioTranscriptResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    try:
        suffix = ext if ext else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        try:
            transcript_text = AIService.transcribe_audio(temp_path)
            return {"text": transcript_text}
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error transcribing audio with AI: {str(e)}"
        )

@router.post("/process-audio", response_model=ExtractedBatch)
async def process_audio(file: UploadFile = File(...)):
    # Verify file extension
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in [".wav", ".mp3", ".webm", ".m4a", ".ogg"]:
        pass
        
    try:
        suffix = ext if ext else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        try:
            transcript_text = AIService.transcribe_audio(temp_path)
            extracted_batch = AIService.extract_structured_data(transcript_text)
            return extracted_batch
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing audio with AI: {str(e)}"
        )

@router.post("/process-photo", response_model=ExtractedBatch)
async def process_photo(file: UploadFile = File(...)):
    # Write to a temp file
    try:
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        suffix = ext if ext else ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        try:
            # Extract structured data from photo using LLM vision
            extracted_batch = AIService.process_photo(temp_path)
            return extracted_batch
        finally:
            # Cleanup temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing photo with AI: {str(e)}"
        )
@router.post("/process-text", response_model=ExtractedBatch)
async def process_text(input_data: TextInput):
    if not input_data.text or not input_data.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text input cannot be empty"
        )
    try:
        extracted_batch = AIService.extract_structured_data(input_data.text)
        return extracted_batch
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing text with AI: {str(e)}"
        )

