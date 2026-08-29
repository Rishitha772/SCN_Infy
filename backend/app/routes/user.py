from fastapi import APIRouter

from app.routes.deps import (
    AdminUser,
    CurrentUser,
    UserAdminServiceDeps,
    UserServiceDeps,
)
from app.schemas import (
    MessageResponse,
    RoleChangeRequest,
    UserResponse,
    UserRoleUpdateRequest,
    UserUpdateRequest,
)

user_router = APIRouter(prefix="/users", tags=["users"])


@user_router.get("/pending", response_model=list[UserResponse])
async def get_pending_users(
    _: AdminUser, user_admin_service: UserAdminServiceDeps
) -> list[UserResponse]:
    return await user_admin_service.get_pending_users()


@user_router.get("/all-users", response_model=list[UserResponse])
async def get_all_users(
    _: AdminUser, user_admin_service: UserAdminServiceDeps
) -> list[UserResponse]:
    return await user_admin_service.get_all_users()


@user_router.patch("/{user_id}/approve", response_model=UserResponse)
async def approve_user(
    user_id: int, _: AdminUser, user_admin_service: UserAdminServiceDeps
) -> UserResponse:
    return await user_admin_service.approve(user_id)


@user_router.patch("/{user_id}/reject", response_model=UserResponse)
async def reject_user(
    user_id: int, _: AdminUser, user_admin_service: UserAdminServiceDeps
) -> UserResponse:
    return await user_admin_service.reject(user_id)


@user_router.patch("/{user_id}/role", response_model=UserResponse)
async def change_role(
    user_id: int,
    data: UserRoleUpdateRequest,
    _: AdminUser,
    user_admin_service: UserAdminServiceDeps,
) -> UserResponse:
    return await user_admin_service.change_role(user_id, data)


@user_router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: int, _: AdminUser, user_admin_service: UserAdminServiceDeps
) -> None:
    await user_admin_service.delete_by_id(user_id)


@user_router.patch("/{user_id}/ban", response_model=UserResponse)
async def ban_user(
    user_id: int, _: AdminUser, user_admin_service: UserAdminServiceDeps
) -> UserResponse:
    return await user_admin_service.ban(user_id)


@user_router.get("/role-change-requests", response_model=list[UserResponse])
async def get_role_change_requests(
    _: AdminUser,
    user_admin_service: UserAdminServiceDeps,
) -> list[UserResponse]:
    return await user_admin_service.get_role_change_requests()


@user_router.patch("/{user_id}/approve-role-change", response_model=UserResponse)
async def approve_role_change(
    user_id: int,
    _: AdminUser,
    user_admin_service: UserAdminServiceDeps,
) -> UserResponse:
    return await user_admin_service.approve_role_change(user_id)


# self service routes
@user_router.patch("/me", response_model=UserResponse)
async def update_me(
    credential: UserUpdateRequest,
    current_user: CurrentUser,
    user_service: UserServiceDeps,
) -> UserResponse:
    return await user_service.update(credential, current_user)


@user_router.delete("/me", status_code=204)
async def delete_me(current_user: CurrentUser, user_service: UserServiceDeps) -> None:
    await user_service.delete(current_user)


@user_router.post("/me/request-role-change", response_model=MessageResponse)
async def request_role_change(
    data: RoleChangeRequest,
    current_user: CurrentUser,
    user_service: UserServiceDeps,
) -> MessageResponse:
    return await user_service.request_role_change(data, current_user)
