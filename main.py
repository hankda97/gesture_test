from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles


app = FastAPI(
    title="手勢偵測 API",
    description="Render-ready API scaffold for hand gesture detection.",
    version="0.1.0",
)

STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False)
def home():
    from fastapi.responses import FileResponse

    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
def health() -> dict[str, str]:
    """Render health check endpoint."""
    return {"status": "ok"}


@app.post("/api/v1/gesture/detect")
async def detect_gesture(file: UploadFile = File(...)) -> dict:
    """Decode an image and return a placeholder detection response.

    The MediaPipe detector will be connected in the next implementation phase.
    Keeping image validation here makes the endpoint ready for that integration.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="請上傳圖片檔案")

    data = await file.read()
    image = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="無法讀取圖片")

    height, width = image.shape[:2]
    return {
        "filename": file.filename,
        "image": {"width": width, "height": height},
        "gestures": [],
        "message": "影像已成功接收；手勢模型尚待接入。",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
