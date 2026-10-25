from app.services import ai_client
from pydantic import BaseModel

class X(BaseModel):
    msg: str

try:
    r = ai_client.ai_client.generate_json('x', 'Return {"msg":"hi"}', X)
    print(r.msg)
except Exception as e:
    print('e')
