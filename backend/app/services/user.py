import logging

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models import User
from app.schemas import (
    MessageResponse,
    RoleChangeRequest,
    UserResponse,
    UserUpdateRequest,
)

logger: logging.Logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session: AsyncSession = session

    async def get_by_email(self, email: str) -> User | None:
        return await self.session.scalar(select(User).where(User.email == email))

    async def update(self, credentials: UserUpdateRequest, user: User) -> UserResponse:
        updates = credentials.model_dump(exclude_none=True)
        if UserUpdateRequest.PASSWORD_FIELD in updates:
            user.password = hash_password(updates.pop(UserUpdateRequest.PASSWORD_FIELD))
        for key, val in updates.items():
            setattr(user, key, val)
        await self.session.commit()
        logger.info("user information updated successfully: %d", user.user_id)
        return UserResponse.from_orm(user)

    async def delete(self, user: User) -> None:
        user_id: int = user.user_id
        await self.session.delete(user)
        await self.session.commit()
        logger.info("user deleted: %s", user_id)

    async def request_role_change(
        self, data: RoleChangeRequest, user: User
    ) -> MessageResponse:
        if data.requested_role == user.role:
            raise HTTPException(status_code=400, detail="already have this role")
        user.requested_role = data.requested_role
        await self.session.commit()
        logger.info(
            "role change requested: user_id=%d role=%s",
            user.user_id,
            data.requested_role,
        )
        return MessageResponse(
            message="role change request submitted — awaiting admin approval"
        )
