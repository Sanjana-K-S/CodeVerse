import requests


OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5-coder:7b"


def ask_ai(prompt: str):
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )

        response.raise_for_status()

        data = response.json()

        return data.get("response", "No response from AI.")

    except requests.exceptions.ConnectionError:
        return "Unable to connect to Ollama. Make sure Ollama is running."

    except requests.exceptions.Timeout:
        return "AI request timed out."

    except Exception as e:
        return f"AI error: {str(e)}"