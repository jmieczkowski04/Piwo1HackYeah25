from pprint import pprint
import external_api.handle_external_api as hea

REGON_NR = "492707333"

pprint(hea.getMainInfoFromREGON(REGON_NR))