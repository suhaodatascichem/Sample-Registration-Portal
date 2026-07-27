import os
import shutil
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.services.ai_service import AIService
from app.schemas import ExtractedBatch

router = APIRouter()

@router.post("/process-audio", response_model=ExtractedBatch)
async def process_audio(file: UploadFile = File(...)):
    # Verify file extension
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in [".wav", ".mp3", ".webm", ".m4a", ".ogg"]:
        # Standard warning, but we still allow trying if we want
        pass
        
    # Write to a temp file
    try:
        suffix = ext if ext else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        try:
            # 1. Transcribe audio to text
            transcript_text = AIService.transcribe_audio(temp_path)
            # 2. Extract structured data from transcribed text
            extracted_batch = AIService.extract_structured_data(transcript_text)
            return extracted_batch
        finally:
            # Cleanup temp file
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
