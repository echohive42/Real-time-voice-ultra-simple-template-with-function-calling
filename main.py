from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
import httpx
from termcolor import colored

# Constants
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = "gpt-4o-realtime-preview-2024-12-17"
DEFAULT_INSTRUCTIONS = """You are a helpful AI assistant. You can engage in voice conversations and help with various tasks.
When using the getLatestArxivPapers function:
1. Always inform the user before making the call
2. Summarize the findings in a clear, concise way
3. Focus on the most relevant papers
4. Provide brief insights about each paper"""

# Initialize FastAPI
app = FastAPI(title="Voice Chat")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    try:
        print(colored("Serving index page...", "green"))
        return FileResponse("static/index.html")
    except Exception as e:
        print(colored(f"Error serving index page: {str(e)}", "red"))
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )

@app.get("/session")
async def create_session():
    try:
        print(colored("Creating new session...", "cyan"))
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/realtime/sessions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": MODEL,
                    "voice": "verse",
                    "instructions": DEFAULT_INSTRUCTIONS
                }
            )
            print(colored("Session created successfully!", "green"))
            return response.json()
    except Exception as e:
        print(colored(f"Error creating session: {str(e)}", "red"))
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to create session"}
        )

if __name__ == "__main__":
    import uvicorn
    print(colored("Starting server...", "yellow"))
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)