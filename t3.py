from google.cloud import aiplatform
aiplatform.init(project="ember-512615", location="us-central1")
from vertexai.generative_models import GenerativeModel
m = GenerativeModel("gemini-2.5-flash")
try:
    r = m.generate_content("say exactly: hello")
    print(r.text)
except Exception as e:
    print(e)
