import external_api.regon_api_handler as rah
import external_api.krs_api_handler as kah

def getKRSInfo(KRS_number = None, REGON_number = None):
    if(KRS_number is None and REGON_number is None):
        return None
    
    if(KRS_number is None):
        regon_api = rah.initializeRegonApi()
        KRS_number = rah.getKRSFromREGON(regon_api, REGON_number)
    
    KRS_info = kah.getKRSinfo(KRS_number)
    return KRS_info

def getMainInfoFromREGON(REGON_number):
    REGON_info = rah.getInfoFromREGON(REGON_number)
    main_info = {
        "name":     REGON_info["praw_nazwa"],
        "nip":      REGON_info["praw_nip"],
        "country":  REGON_info["praw_adSiedzKraj_Nazwa"],
        "voivodeship": REGON_info["praw_adSiedzWojewodztwo_Nazwa"],
        "city": REGON_info["praw_adSiedzMiejscowosc_Nazwa"],
        "street": REGON_info["praw_adSiedzUlica_Nazwa"],
        "street_number": REGON_info["praw_adSiedzNumerNieruchomosci"],
        "postal_code": REGON_info["praw_adSiedzKodPocztowy"]
    }
    return main_info