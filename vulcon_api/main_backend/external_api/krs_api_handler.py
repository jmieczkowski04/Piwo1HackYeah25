import requests

# gets the krs info in JSON format
def getKRSinfo(krsNumber):
    response = requests.get(f"https://api-krs.ms.gov.pl/api/krs/OdpisAktualny/{krsNumber}?rejestr=P&format=json")
    return response.json()