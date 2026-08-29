import re
from datetime import datetime
from typing import ClassVar, Self

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    SecretStr,
    field_validator,
    model_validator,
)

from app.core.constants import (
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    VERIFICATION_CODE_LENGTH,
    TokenType,
    UserRole,
    UserStatus,
)
from app.core.domains import is_research_email
from app.schemas.base import ResponseBase


def validate_research_email(email: str) -> str:
    if not is_research_email(email):
        raise ValueError("email must be from a recognised institution")
    return email


def validate_password_strength(password: SecretStr) -> SecretStr:
    raw: str = password.get_secret_value()
    if not re.search(r"[A-Za-z]", raw):
        raise ValueError("password must contain at least one letter")
    if not re.search(r"\d", raw):
        raise ValueError("password must contain at least one number")
    return password


def validate_non_admin_role(role: UserRole) -> UserRole:
    if role == UserRole.SYSTEM_ADMIN:
        raise ValueError("system admin role cannot be self-declared")
    return role


# -- Core Models --
class EmailValidatorMixin(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def check_domain(cls, email: str) -> str:
        return validate_research_email(email)


class PasswordValidatorMixin(BaseModel):
    @model_validator(mode="after")
    def check_strength(self) -> Self:
        password: SecretStr | None = getattr(self, "password", None)
        if password is not None:
            validate_password_strength(password)
        return self


class RequestedRoleMixin(BaseModel):
    requested_role: UserRole

    @field_validator("requested_role")
    @classmethod
    def check_role(cls, role: UserRole) -> UserRole:
        return validate_non_admin_role(role)


class RequiredPasswordMixin(PasswordValidatorMixin):
    password: SecretStr = Field(
        min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH
    )


class OptionalPasswordMixin(PasswordValidatorMixin):
    password: SecretStr | None = Field(
        default=None, min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH
    )


# -- Requests --
class UserRequest(EmailValidatorMixin, RequiredPasswordMixin, RequestedRoleMixin):
    model_config = ConfigDict(extra="forbid")
    requested_role: UserRole = Field(default=UserRole.RESEARCHER)


class UserUpdateRequest(OptionalPasswordMixin):
    PASSWORD_FIELD: ClassVar[str] = "password"


class UserRoleUpdateRequest(BaseModel):
    role: UserRole


class RoleChangeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    requested_role: UserRole

    @field_validator("requested_role")
    @classmethod
    def check_role(cls, role: UserRole) -> UserRole:
        return validate_non_admin_role(role)


class VerificationCodeRequest(EmailValidatorMixin):
    code: str = Field(
        min_length=VERIFICATION_CODE_LENGTH, max_length=VERIFICATION_CODE_LENGTH
    )


class EmailChangeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    new_email: EmailStr

    @field_validator("new_email", mode="before")
    @classmethod
    def check_domain(cls, new_email) -> str:
        return validate_research_email(new_email)


class RefreshRequest(BaseModel):
    refresh_token: str


# -- Responses --
class UserResponse(ResponseBase):
    user_id: int
    email: EmailStr
    role: UserRole
    status: UserStatus
    is_verified: bool


class TokenPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    sub: str
    token_type: TokenType = Field(alias="type")
    exp: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str
