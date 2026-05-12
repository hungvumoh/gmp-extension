from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import uvicorn

app = FastAPI()

# Enable CORS for Chrome Extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/review-dossier")
async def review_dossier(payload: Dict = Body(...)):
    files = payload.get("files", [])
    file_names = [f.get("name") for f in files]
    print(f"--- Incoming Request ---")
    print(f"Total files: {len(files)}")
    for i, name in enumerate(file_names, 1):
        print(f"  {i}. {name}")
    
    reviews = []
    for f in files:
        name = f.get("name", "Unknown")
        # Simple mock logic based on filename
        if "GMP" in name.upper() or "CERT" in name.upper():
            status = "pass"
            comment = "Tài liệu hợp lệ, đầy đủ thông tin."
        elif "SMF" in name.upper() or "SITE" in name.upper():
            status = "warning"
            comment = "Cần kiểm tra lại sơ đồ mặt bằng, một số chi tiết mờ."
        else:
            status = "fail"
            comment = "Tài liệu không đúng định dạng hoặc thiếu chữ ký."
            
        reviews.append({
            "name": name,
            "status": status,
            "comment": comment
        })
        
    return {
        "reviews": reviews,
        "conclusion": "Bộ hồ sơ đáp ứng yêu cầu cơ bản nhưng cần bổ sung các tài liệu còn thiếu."
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
