from app.core.config import settings
from app.services import ai_client

if __name__ == "__main__":
    h = ai_client.ai_client.health_check()
    print(h)
