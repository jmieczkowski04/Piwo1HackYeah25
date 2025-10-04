from RegonAPI import RegonAPI
from RegonAPI.exceptions import ApiAuthenticationError

API_KEY = "abcde12345abcde12345"

# initializes Regon API
def initializeRegonApi() -> RegonAPI:
    api = RegonAPI(
    bir_version="bir1.1", is_production=False, timeout=10, operation_timeout=10
    )
    try:
        api.authenticate(key=API_KEY)
    except ApiAuthenticationError as e:
        print("[-]", e)
        exit(0)
    except Exception as e:
        raise

    return api

# gets the KRS number for REGON number using regon API
def getKRSFromREGON(regonApi: RegonAPI, regonNumber):
    requestType = "BIR11OsPrawna"
    regonApi.searchData(regon=regonNumber)
    result = regonApi.dataDownloadFullReport(regonNumber, requestType)
    KRSNumber = result[0] #["praw_numerWRejestrzeEwidencji"]
    return KRSNumber

def getInfoFromREGON(REGON_number):
    REGON_api = initializeRegonApi()
    REGON_info = REGON_api.dataDownloadFullReport(REGON_number, "BIR11OsPrawna")
    return REGON_info[0]