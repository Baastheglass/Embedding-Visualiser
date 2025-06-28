import os
import openai
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv('OPENAI_API_KEY') # Replace with your actual key

response = openai.embeddings.create(
    model="text-embedding-3-small",  # or text-embedding-3-large
    input="The quick brown fox jumps over the lazy dog"
)

print(response)