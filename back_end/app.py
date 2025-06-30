from fastapi import FastAPI
from embeddings import get_embeddings
import uvicorn

app = FastAPI()

@app.get("/getEmbeddings")
def getEmbeddings():
    embeddings = get_embeddings("The funny dog is not pooping why is he not poooping?!")
    return {"embeddings": embeddings.tolist(), "sentence": "The funny dog is not pooping why is he not poooping?!"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 
