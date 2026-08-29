from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pydantic import SecretStr

pwd_hasher = PasswordHash([Argon2Hasher()])


def hash_password(password: SecretStr) -> str:
    return pwd_hasher.hash(password.get_secret_value())


def verify_password(plain: SecretStr, hashed: str) -> bool:
    return pwd_hasher.verify(plain.get_secret_value(), hashed)
