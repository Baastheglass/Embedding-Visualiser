from fastapi import FastAPI
from embeddings import get_embeddings
import uvicorn
from utils import delete_contents
app = FastAPI()

@app.get("/getEmbeddings")
def getEmbeddings():
    embeddings = get_embeddings("Why is the funny dog not pooping :(")
    if(type(embeddings) == str):
        return {"error": embeddings}
    else:
        return {"embeddings": embeddings[0].tolist(), "sentences": embeddings[1]}

@app.post("/deleteContents")
def deleteContents():
    delete_contents()
    return {"message": "Contents deleted"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 
