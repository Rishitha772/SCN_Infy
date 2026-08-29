import logging

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.engine.result import ScalarResult
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import UserStatus
from app.core.interfaces import EmailNotifier
from app.models import User
from app.schemas import UserResponse, UserRoleUpdateRequest

logger: logging.Logger = logging.getLogger(__name__)


class UserAdminService:
    def __init__(self, session: AsyncSession, email_notifier: EmailNotifier) -> None:
        self.session: AsyncSession = session
        self.email_notifier: EmailNotifier = email_notifier

    async def get_user(self, user_id: int) -> UserResponse:
        user: User = await self._get_by_id(user_id)
        return UserResponse.from_orm(user)

    async def get_all_users(self) -> list[UserResponse]:
        logger.debug("fetching all users")
        result: ScalarResult[User] = await self.session.scalars(select(User))
        return [UserResponse.from_orm(user) for user in result.all()]

    async def get_pending_users(self) -> list[UserResponse]:
        logger.debug("fetching pending users")
        result: ScalarResult[User] = await self.session.scalars(
            select(User).where(User.status == UserStatus.PENDING)
        )
        return [UserResponse.from_orm(user) for user in result.all()]

    async def get_role_change_requests(self) -> list[UserResponse]:
        logger.debug("fetching role change requests")
        result: ScalarResult[User] = await self.session.scalars(
            select(User).where(User.requested_role.isnot(None))
        )
        return [UserResponse.from_orm(user) for user in result.all()]

    async def approve(self, user_id: int) -> UserResponse:
        user: User = await self._get_by_id(user_id)
        await self._set_status(user, UserStatus.ACTIVE, require_pending=True)
        self.email_notifier.send_approval_notification(user.email)
        logger.info("user approved: %d", user.user_id)
        return UserResponse.from_orm(user)

    async def reject(self, user_id: int) -> UserResponse:
        user: User = await self._get_by_id(user_id)
        await self._set_status(user, UserStatus.REJECTED, require_pending=True)
        self.email_notifier.send_rejection_notification(user.email)
        logger.info("user rejected: %d", user.user_id)
        return UserResponse.from_orm(user)

    async def ban(self, user_id: int) -> UserResponse:
        user: User = await self._get_by_id(user_id)
        await self._set_status(user, UserStatus.BANNED)
        self.email_notifier.send_ban_notification(user.email)
        logger.info("user banned: %d", user.user_id)
        return UserResponse.from_orm(user)

    async def change_role(
        self, user_id: int, data: UserRoleUpdateRequest
    ) -> UserResponse:
        user: User = await self._get_by_id(user_id)
        if user.role == data.role:
            raise HTTPException(status_code=409, detail="user already has this role")
        user.role = data.role
        user.requested_role = None
        await self.session.commit()
        logger.info("role changed for user: %d", user_id)
        return UserResponse.from_orm(user)

    async def approve_role_change(self, user_id: int) -> UserResponse:
        user: User = await self._get_by_id(user_id)
        if not user.requested_role:
            raise HTTPException(status_code=400, detail="no role change requested")
        logger.debug("approving role change: user_id=%d", user_id)
        user.role = user.requested_role
        user.requested_role = None
        await self.session.commit()
        logger.info("role changed for user: %d", user_id)
        return UserResponse.from_orm(user)

    async def delete_by_id(self, user_id: int) -> None:
        user: User = await self._get_by_id(user_id)
        await self.session.delete(user)
        await self.session.commit()
        logger.info("user deleted: %d", user_id)

    async def _get_by_id(self, user_id: int) -> User:
        user: User | None = await self.session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="user not found")
        return user

    async def _set_status(
        self, user: User, status: UserStatus, require_pending: bool = False
    ) -> None:
        if require_pending and user.status != UserStatus.PENDING:
            raise HTTPException(
                status_code=409, detail="user must be pending for this action"
            )
        if user.status == status:
            raise HTTPException(
                status_code=409, detail=f"user is already {status.value}"
            )
        user.status = status
        await self.session.commit()
