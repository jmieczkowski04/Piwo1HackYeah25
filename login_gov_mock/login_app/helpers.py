import os
from rest_framework_simplejwt.tokens import RefreshToken

def get_attach_token_url(user):
    refresh_token = RefreshToken.for_user(user)
    access_token = str(refresh_token.access_token)
    return os.getenv("MAIN_BACKEND_TOKEN_ATTACH_URL", "http://localhost:8000/api/attach_token/") + f"?refresh_token={str(refresh_token)}&access_token={access_token}"
    