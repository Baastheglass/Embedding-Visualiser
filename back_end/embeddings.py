import os
import openai
from dotenv import load_dotenv
from sklearn.decomposition import PCA
import umap
import numpy as np

def pca_reduction(embeddings):
    # Apply PCA to reduce to 2 dimensions
    reducer = PCA(n_components=2)
    reduced_embeddings = reducer.fit_transform(embeddings)
    return reduced_embeddings
    
def get_embeddings():
    load_dotenv()
    openai.api_key = os.getenv('OPENAI_API_KEY') # Replace with your actual key
    with open('sentences.txt', 'r') as file:
        sentences = file.read().splitlines()

    embeddings = []
    for sentence in sentences:
        response = openai.embeddings.create(
            model="text-embedding-3-small",
            input=sentence
        )
        embeddings.append(response.data[0].embedding)
    if(len(sentences) > 1):
        reduced_embeddings = pca_reduction(embeddings)
        return (reduced_embeddings, sentences)
    else:
        return "Need at least 2 sentences for visualization"
    
if __name__ == "__main__":
    while True:
        input_sentence = input("Enter a sentence (or 'exit' to quit): ")
        with open('sentences.txt', 'a') as file:
            file.write(input_sentence + '\n')
        if input_sentence.lower() == 'exit':
            break
        print(get_embeddings())
    