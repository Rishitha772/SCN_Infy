from app.core.security import hash_password, verify_password
from pydantic import SecretStr

PASSWORD = "TestPass123"


def test_hash_is_not_plain_text() -> None:
    hashed: str = hash_password(SecretStr(PASSWORD))
    assert hashed != PASSWORD


def test_correct_password_verifies() -> None:
    hashed: str = hash_password(SecretStr(PASSWORD))
    assert verify_password(SecretStr(PASSWORD), hashed) is True


def test_wrong_password_fails() -> None:
    hashed: str = hash_password(SecretStr(PASSWORD))
    assert verify_password(SecretStr("WrongPass123"), hashed) is False


def test_two_hashes_of_same_password_differ() -> None:
    hashed1: str = hash_password(SecretStr(PASSWORD))
    hashed2: str = hash_password(SecretStr(PASSWORD))
    assert hashed1 != hashed2
