# main.py

from fastapi import FastAPI

# Create an instance of the FastAPI application
# This is the main object that will handle all your API routes.
app = FastAPI()

# Define a path operation decorator.
# The '@app.get("/")' decorator tells FastAPI that the function directly below it
# should be executed when an HTTP GET request is received at the root URL ("/").
@app.get("/")
async def read_root():
    """
    This asynchronous function handles GET requests to the root endpoint.
    It returns a simple JSON response.
    """
    return {"message": "Hello from MythosForgeAI Backend!"}

# To run this application:
# 1. Make sure you have FastAPI and Uvicorn installed:
#    pip install fastapi uvicorn
# 2. Save the code above as 'main.py'.
# 3. Open your terminal in the directory where you saved 'main.py' and run:
#    uvicorn main:app --reload
#
#    - `main`: Refers to the 'main.py' file.
#    - `app`: Refers to the `app = FastAPI()` object inside 'main.py'.
#    - `--reload`: This flag is super useful during development. It tells Uvicorn
#                  to automatically restart the server whenever you make changes
#                  to your code.
#
# Once it's running, open your web browser and go to http://127.0.0.1:8000
# You should see the JSON message: {"message": "Hello from MythosForgeAI Backend!"}
#
# You can also go to http://127.0.0.1:8000/docs for the automatic API documentation
# provided by FastAPI (powered by Swagger UI). This is one of FastAPI's coolest features!
