from fastapi import FastAPI, HTTPException
from embeddings import get_embeddings
import uvicorn
from utils import delete_contents
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# List of allowed frontend origins
origins = [
    "http://localhost:3000",  # React/Next.js local dev
    "http://127.0.0.1:3000",
    "https://embedding-visualiser.vercel.app/",  # Add deployed frontend here
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,              # List of allowed origins
    allow_credentials=True,             # Cookies / Auth headers
    allow_methods=["*"],                # Allowed HTTP methods
    allow_headers=["*"],                # Allowed HTTP headers
)

class TextRequest(BaseModel):
    text: list[str]

@app.post("/getEmbeddings")
def getEmbeddings(text: TextRequest):
    try:
        print(f"Received text: {text.text}")
        embeddings = get_embeddings(text.text)
        if isinstance(embeddings, str):
            # This is an error message
            raise HTTPException(status_code=400, detail=embeddings)
        else:
            return {"embeddings": embeddings[0].tolist(), "sentences": embeddings[1]}
    except Exception as e:
        print(f"Error in getEmbeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/deleteContents")
def deleteContents():
    delete_contents()
    return {"message": "Contents deleted"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 
