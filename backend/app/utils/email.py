import logging
import smtplib
from dataclasses import dataclass
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import HTTPException

from app.core.constants import TOTP_INTERVAL
from app.core.interfaces import EmailNotifier

logger: logging.Logger = logging.getLogger(__name__)


@dataclass
class SMTPConfig:
    host: str
    port: int
    user: str
    password: str


class ConsoleEmailNotifier(EmailNotifier):
    TOTP_MINUTES = int(TOTP_INTERVAL.total_seconds() // 60)

    def __init__(self) -> None:
        pass

    def send_verification_email(self, email: str, code: str) -> None:
        print(
            f"{'= ' * 50}\nVerification Code for {email} is {code}. "
            f"This code will expire in {self.TOTP_MINUTES} minute{'s' if self.TOTP_MINUTES > 1 else ''}.\n{'= ' * 50}"
        )

    def send_approval_notification(self, email: str) -> None:
        print(
            f"\n{'= ' * 50}\nAccount Approved\nEmail : {email}\nYour account has been approved. You can now login.\n{'= ' * 50}\n"
        )

    def send_rejection_notification(self, email: str) -> None:
        print(
            f"\n{'= ' * 50}\nAccount Rejected\nEmail : {email}\nYour registration was not approved.\n{'= ' * 50}\n"
        )

    def send_ban_notification(self, email: str) -> None:
        print(
            f"\n{'= ' * 50}\nAccount Banned\nEmail : {email}\nYour account has been banned by the administrator.\n{'= ' * 50}\n"
        )


class SMTPEmailNotifier(EmailNotifier):
    TOTP_MINUTES = int(TOTP_INTERVAL.total_seconds() // 60)

    def __init__(self, smtp_config: SMTPConfig) -> None:
        self.smtp_config: SMTPConfig = smtp_config

    def _send_email(self, to: str, subject: str, body: str) -> None:
        try:
            message = MIMEMultipart()
            message["From"] = self.smtp_config.user
            message["To"] = to
            message["Subject"] = subject
            message.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(self.smtp_config.host, self.smtp_config.port) as server:
                server.starttls()
                server.login(self.smtp_config.user, self.smtp_config.password)
                server.sendmail(self.smtp_config.user, to, message.as_string())
            logger.info("email sent to [redacted] with subject %s", subject)

        except smtplib.SMTPException as e:
            logger.error("failed to send email to [redacted]: %s", e)
            raise HTTPException(status_code=500, detail="failed to send email")

    def send_verification_email(self, email: str, code: str) -> None:
        body: str = f"""
        Your verification code is: {code}
        This code expires in {self.TOTP_MINUTES} minute{"s" if self.TOTP_MINUTES > 1 else ""}.
        If you did not register, ignore this email.
        """
        self._send_email(email, "Research Platform - Email Verification", body)

    def send_approval_notification(self, email: str) -> None:
        body = "Your account has been approved by the administrator. You can now login."
        self._send_email(email, "Research Platform - Account Approved", body)

    def send_rejection_notification(self, email: str) -> None:
        body = """Your account has been rejected by the administrator."""
        self._send_email(email, "Research Platform — Account Rejected", body)

    def send_ban_notification(self, email: str) -> None:
        body = """Your account has been banned by the administrator."""
        self._send_email(email, "Research Platform — Account Banned", body)
