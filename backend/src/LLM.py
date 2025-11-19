import os
from openai import OpenAI
from dotenv import load_dotenv

import psycopg2
from urllib.parse import urlparse


#load_dotenv("venv/.env") # Loads environment variables from .env
token = os.getenv("GITHUB_TOKEN")
endpoint = "https://models.github.ai/inference"
model="openai/gpt-4o"
# A function to call an LLM model and return the response
def call_llm_model(model, messages, temperature=1.0, top_p=1.0):
    client = OpenAI(base_url=endpoint,api_key=token)
    response = client.chat.completions.create(
    messages=messages,
    temperature=temperature, top_p=top_p, model=model)
    return response.choices[0].message.content
# A function to translate to target language
def ai_assistant(text):
    prompt = f"{text}"
    messages = [
        {"role": "user", "content": prompt}
    ]
    return call_llm_model(model, messages)


#main function
if __name__ == "__main__":
    # Test basic translation
    print("=== Testing Basic Translation ===")
    text = "hi"
    answer = ai_assistant(text)
    print(f"Question Text: {text}")
    print(f"Answer Text: {answer}")
    
    