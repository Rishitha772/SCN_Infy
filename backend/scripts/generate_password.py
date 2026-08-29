import secrets
import string


def generate_password(length=16) -> str:
    characters: str = string.ascii_letters + string.digits + string.punctuation
    password: str = "".join(secrets.choice(characters) for _ in range(length))
    return password


print(generate_password())
