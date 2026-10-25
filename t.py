from google.cloud import aiplatform
aiplatform.init(project="ember-512615", location="us-central1")
from vertexai.generative_models import GenerativeModel
m = GenerativeModel("gemini-2.5-flash")
r = m.generate_content("say exactly: hello")
print(r.candidates[0].content.parts[0].text)
