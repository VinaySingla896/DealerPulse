import json
import random
from datetime import datetime, timedelta

DATA_AS_OF = datetime.fromisoformat("2025-12-31T19:10:00+00:00")
DEC_START = datetime.fromisoformat("2025-12-01T00:00:00+00:00")

# Models and standard pricing (INR)
MODELS = [
    ('Glanza', 850000, 1050000),
    ('Urban Cruiser Hyryder', 1400000, 2000000),
    ('Innova Crysta', 2000000, 2600000),
    ('Innova Hycross', 2600000, 3100000),
    ('Fortuner', 3800000, 5100000),
    ('Hilux', 3100000, 3800000),
    ('Camry', 4600000, 4800000)
]

print("Script template ready")
