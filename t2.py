from google.cloud import aiplatform
aiplatform.init(project="ember-512615", location="us-central1")
from vertexai.generative_models import GenerativeModel, GenerationConfig
m = GenerativeModel("gemini-2.5-flash")
r = m.generate_content("say exactly: hello", generation_config=GenerationConfig(temperature=0.2))
print(r.text)
