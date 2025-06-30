import os
import openai
from dotenv import load_dotenv
import umap

def get_embeddings(input_sentence):
    load_dotenv()
    openai.api_key = os.getenv('OPENAI_API_KEY') # Replace with your actual key
    with open('sentences.txt', 'r') as file:
        sentences = file.read().splitlines()
        print(sentences)
    # embeddings = []
    # for sentence in sentences:
    #     response = openai.embeddings.create(
    #         model="text-embedding-3-small",
    #         input=sentence
    #     )
    #     embeddings.append(response.data[0].embedding)

    # reducer = umap.UMAP(n_components=2, metric='cosine', random_state=42)
    # reduced_embeddings = reducer.fit_transform(embeddings)
    # return reduced_embeddings, sentences
if __name__ == "__main__":
    input_sentence = "The funny dog is not pooping why is he not poooping?!"
    get_embeddings(input_sentence)
    